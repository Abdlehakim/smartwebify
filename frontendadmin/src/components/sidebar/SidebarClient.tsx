/* ------------------------------------------------------------------
   src/components/sidebar/SidebarClient.tsx
------------------------------------------------------------------ */
"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import { useAuth } from "@/hooks/useAuthDashboard";
import LoadingDots from "@/components/LoadingDots";

import { LuArrowBigLeft, LuArrowBigRight } from "react-icons/lu";
import { BiChevronRight, BiChevronDown, BiChevronUp } from "react-icons/bi";
import { VscSignOut } from "react-icons/vsc";
import { FaBars } from "react-icons/fa6";
import IconButton from "@/components/sidebar/IconButton";
import { sidebarItems } from "@/components/sidebar/sidebarItems";

interface SidebarItem {
  name: string;
  href?: string;
  icon?: React.ReactElement;
  permission?: string;
  children?: SidebarItem[];
  isHeader?: boolean;
}

const normalizePath = (s?: string) => {
  if (!s) return "";
  const noTrail = s.replace(/\/+$/, "");
  return noTrail.length ? noTrail : "/";
};

const collectHrefs = (items?: SidebarItem[]): string[] => {
  const out: string[] = [];
  items?.forEach((it) => {
    if (it.href) out.push(it.href);
    if (it.children) out.push(...collectHrefs(it.children));
  });
  return out;
};

export default function SidebarClient() {
  const { user, loading, logout } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  const [collapsed, setCollapsed] = useState(true);
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  const [redirecting, setRedirecting] = useState(false);
  const [signingOut, setSigningOut] = useState(false);

  // Scroll hint state
  const navRef = useRef<HTMLDivElement | null>(null);
  const [showTopShadow, setShowTopShadow] = useState(false);
  const [showBottomShadow, setShowBottomShadow] = useState(false);
  const [atTop, setAtTop] = useState(true);

  useEffect(() => {
    if (!loading && !user && !redirecting) {
      setRedirecting(true);
      router.push("/");
    }
  }, [loading, user, redirecting, router]);

  const closeIfMobile = useCallback(() => {
    if (
      typeof window !== "undefined" &&
      window.matchMedia("(max-width: 767px)").matches
    ) {
      setCollapsed(true);
    }
  }, []);

  const isHrefActive = (href?: string) => {
    if (!href) return false;
    const cur = normalizePath(pathname || "/");
    const target = normalizePath(href);
    if (target === "/dashboard") return cur === target;
    return cur === target || cur.startsWith(target + "/");
  };

  const isSectionActive = (item: SidebarItem): boolean => {
    if (isHrefActive(item.href)) return true;
    if (item.children?.length) return item.children.some(isSectionActive);
    return false;
  };

  useEffect(() => {
    const current = normalizePath(pathname || "/");
    const next: Record<string, boolean> = {};
    sidebarItems.forEach((item) => {
      if (!item.children) return;
      const hrefs = collectHrefs(item.children).map(normalizePath);
      const match = hrefs.some(
        (h) => current === h || current.startsWith(h + "/")
      );
      if (match) next[item.name] = true;
    });
    setExpanded(next);
  }, [pathname]);

  // ── Scroll shadow logic ───────────────────────────────────────────
  const computeScrollHints = useCallback(() => {
    const el = navRef.current;
    if (!el) return;

    const { scrollTop, scrollHeight, clientHeight } = el;
    const maxScrollTop = scrollHeight - clientHeight;
    const atTopNow = scrollTop <= 0;
    const atBottomNow = scrollTop >= maxScrollTop - 1;

    setAtTop(atTopNow);
    setShowTopShadow(!atTopNow);
    setShowBottomShadow(!atBottomNow);
  }, []);

  useEffect(() => {
    // attach listeners only when expanded (scrollable)
    const el = navRef.current;
    if (!el) return;

    const handle = () => computeScrollHints();
    handle(); // initial

    el.addEventListener("scroll", handle, { passive: true });
    window.addEventListener("resize", handle);

    return () => {
      el.removeEventListener("scroll", handle);
      window.removeEventListener("resize", handle);
    };
  }, [computeScrollHints, collapsed]);

  useEffect(() => {
    // recompute on content/route change
    computeScrollHints();
  }, [pathname, expanded, computeScrollHints]);

  if (loading || redirecting) {
    return (
      <div className="fixed inset-0 z-[1000]">
        <LoadingDots />
      </div>
    );
  }

  if (!user) return null;

  const initials = (user.username || user.email).slice(0, 2).toUpperCase();
  const hasPermission = (perm: string) =>
    Boolean(user.role?.permissions?.includes(perm));
  const toggleCollapse = () => setCollapsed((c) => !c);
  const toggleExpand = (name: string) =>
    setExpanded((prev) => {
      const isOpen = !!prev[name];
      return isOpen ? {} : { [name]: true };
    });

  const handleSignOut = async () => {
    if (signingOut) return;
    setSigningOut(true);
    try {
      await logout();
    } finally {
      localStorage.removeItem("rememberedAdminEmail");
      localStorage.removeItem("token_FrontEndAdmin");
      localStorage.removeItem("adminUserName");
      router.replace("/");
      setSigningOut(false);
    }
  };

  const CollapsedRow: React.FC<{ item: SidebarItem }> = ({ item }) => {
    const hasChildren =
      Array.isArray(item.children) && item.children.length > 0;
    const active = isSectionActive(item);

    return (
      <div key={item.name} className="group relative flex flex-col md:gap-2">
        <div
          className={`flex h-12 gap-2 justify-center items-center transition-all duration-200 my-1 ${
            active
              ? "bg-white text-black mx-2 rounded"
              : "hover:bg-white hover:text-black mx-2 rounded"
          }`}
          title={item.name}
        >
          {item.href && !hasChildren ? (
            <Link
              href={item.href}
              onClick={closeIfMobile}
              aria-current={isHrefActive(item.href) ? "page" : undefined}
              className="flex items-center justify-center w-full h-full"
            >
              {item.icon}
            </Link>
          ) : (
            <div className="w-full h-full flex items-center justify-center cursor-pointer">
              {item.icon}
            </div>
          )}
        </div>
        <span
          aria-hidden
          className="absolute left-full top-0 bottom-0 w-2 z-40"
        />
        {hasChildren && (
          <div className="hidden group-hover:block absolute left-full top-0 ml-2 z-50 min-w-56 max-w-72 rounded-md shadow-xl bg-primary text-white overflow-hidden">
            <div className="px-3 py-2 text-xs font-semibold bg-white/10">
              {item.name}
            </div>
            <div className="py-2">
              {item.children?.map((child) => {
                if (child.isHeader) {
                  return (
                    <div key={child.name} className="mb-1">
                      <div className="px-4 py-2 text-[11px] uppercase tracking-wide text-white/80">
                        {child.name}
                      </div>
                      <ul className="px-2 flex flex-col gap-1">
                        {child.children?.map((sub) => {
                          const activeSub = isHrefActive(sub.href);
                          return (
                            <li key={sub.name}>
                              <Link
                                href={sub.href!}
                                onClick={closeIfMobile}
                                aria-current={activeSub ? "page" : undefined}
                                className={`flex items-center gap-2 px-4 py-1 text-sm rounded ${
                                  activeSub
                                    ? "bg-white text-black"
                                    : "hover:bg-white hover:text-hoverText"
                                }`}
                              >
                                <span>{sub.name}</span>
                              </Link>
                            </li>
                          );
                        })}
                      </ul>
                    </div>
                  );
                }

                const activeChild = isHrefActive(child.href);
                return (
                  <Link
                    key={child.name}
                    href={child.href!}
                    onClick={closeIfMobile}
                    aria-current={activeChild ? "page" : undefined}
                    className={`flex flex-col my-1 px-4 py-1 text-sm ${
                      activeChild
                        ? "bg-white text-black"
                        : "hover:bg-white hover:text-hoverText"
                    }`}
                  >
                    <span>{child.name}</span>
                  </Link>
                );
              })}
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <>
      {/* Mobile hamburger (show only when sidebar is collapsed) */}
      {collapsed && (
        <div className="md:hidden fixed py-4 px-2 flex justify-end">
          <button
            type="button"
            onClick={() => setCollapsed(false)}
            aria-label="Ouvrir le menu"
            title="Ouvrir le menu"
            className="p-2 rounded-md border-2 border-white/20 text-primary active:scale-95 transition"
          >
            <FaBars size={30} />
          </button>
        </div>
      )}

      {!collapsed ? (
        <div onClick={toggleCollapse}   className="fixed inset-0 bg-black/30 z-40 md:hidden" />
      ) : null}

      <aside
        className={`fixed top-0 left-0 z-50 h-[100dvh] bg-primary text-white
    transition-all duration-300 ease-in-out
    ${
      collapsed
        ? "-translate-x-full w-[60px]"
        : "translate-x-0 w-[70%] md:w-[280px]"
    }
    md:sticky md:top-0 md:self-start md:translate-x-0`}
      >
        <div className="flex flex-col justify-between h-screen">
          <div className="flex items-center justify-center h-[80px] border-b-2 z-50">
            <div className="flex items-center gap-2">
              <div className=" text-xl text-white flex items-center justify-center font-semibold border-y-2">
                {initials}
              </div>

              {!collapsed && (
                <>
                  <div className="flex flex-col transition-all whitespace-nowrap duration-500 ease-in-out">
                    <span className="capitalize">
                      {user.username ?? user.email}
                    </span>
                    <span className="text-[8px] font-light">
                      Role: {user.role?.name ?? "—"}
                    </span>
                  </div>

                  {/* Mobile-only close arrow (after the user block) */}
                  <button
                    type="button"
                    onClick={() => setCollapsed(true)}
                    aria-label="Fermer le menu"
                    title="Fermer le menu"
                    className=" ml-4 md:hidden inline-flex h-8 w-8 items-center justify-center text-white hover:bg-white/20 active:scale-95"
                  >
                    <LuArrowBigLeft size={30} />
                  </button>
                </>
              )}
            </div>

            {/* Collapse handle (hidden on mobile, visible on md+) */}
            <IconButton
              icon={
                collapsed ? (
                  <LuArrowBigRight size={20} />
                ) : (
                  <LuArrowBigLeft size={20} />
                )
              }
              onClick={toggleCollapse}
              ariaLabel={
                collapsed
                  ? "Ouvrir la barre latérale"
                  : "Fermer la barre latérale"
              }
            />
          </div>
          {/* Top shadow hint */}
          {!collapsed && (
            <div
              aria-hidden
              className={`pointer-events-none absolute left-0 right-0 h-4 transition-opacity duration-200
                bg-gradient-to-b from-black/50 to-transparent
                ${
                  showTopShadow ? "opacity-100" : "opacity-0"
                } top-[80px]`}
            />
          )}

          {/* Optional tiny top chip when not at top (desktop only) */}
          {!collapsed && showTopShadow && (
            <div className="pointer-events-none hidden md:block absolute right-3 top-[85px]">
              <div className="flex items-center gap-1 px-2 py-1 rounded-full bg-white/15 text-[8px] uppercase tracking-wide ">
                <BiChevronUp size={8} />
                <span>Top</span>
              </div>
            </div>
          )}
          {/* NAV + Scroll hints */}
          <nav
            ref={navRef}
            className={`flex-1 flex-col h-[40%] py-4
    ${collapsed ? "overflow-visible" : "overflow-y-auto overflow-x-hidden"}
    [&::-webkit-scrollbar]:w-[4px]
    [&::-webkit-scrollbar-track]:bg-transparent
    [&::-webkit-scrollbar-thumb]:bg-white/10
    hover:[&::-webkit-scrollbar-thumb]:bg-white/20
    active:[&::-webkit-scrollbar-thumb]:bg-white/25
    [&::-webkit-scrollbar-thumb]:rounded-full
    [scrollbar-width:thin]
    [scrollbar-color:rgba(255,255,255,0.2)_transparent]
    [&::-webkit-scrollbar-button]:hidden

    [&::-webkit-scrollbar-button:single-button]:hidden
    [&::-webkit-scrollbar-button:start:decrement]:hidden
    [&::-webkit-scrollbar-button:end:increment]:hidden
  `}
          >
            <div className="flex flex-col">
              {sidebarItems
                .filter(
                  (item) => !item.permission || hasPermission(item.permission)
                )
                .map((item) => {
                  const isOpen = !!expanded[item.name];

                  if (collapsed) {
                    return <CollapsedRow key={item.name} item={item} />;
                  }

                  return (
                    <div key={item.name}>
                      {item.children ? (
                        <>
                          <div
                            onClick={() => {
                              toggleExpand(item.name);
                              // after expand/collapse, recompute shadows
                              requestAnimationFrame(computeScrollHints);
                            }}
                            onTouchStart={() => {}}
                            role="button"
                            tabIndex={0}
                            onKeyDown={(e) => {
                              if (e.key === "Enter" || e.key === " ") {
                                e.preventDefault();
                                toggleExpand(item.name);
                                requestAnimationFrame(computeScrollHints);
                              }
                            }}
                            aria-expanded={isOpen}
                            className={[
                              "flex items-center px-8 h-12 cursor-pointer text-xs select-none my-0.5 mx-2 rounded",
                              isSectionActive(item)
                                ? "bg-white text-black"
                                : "hover:bg-white hover:text-hoverText active:bg-white active:text-black focus:bg-white focus:text-hoverText",
                            ].join(" ")}
                          >
                            <span className="mr-3">{item.icon}</span>
                            <span className="flex-1 whitespace-nowrap overflow-hidden">
                              {item.name}
                            </span>
                            <span
                              className={[
                                "transform transition-transform duration-200 ease-in-out",
                                isOpen ? "rotate-90" : "rotate-0",
                              ].join(" ")}
                            >
                              <BiChevronRight size={20} />
                            </span>
                          </div>

                          <ul
                            className={`ml-8 flex flex-col text-xs overflow-hidden transition-all duration-500 ease-in-out gap-1 ${
                              isOpen
                                ? "max-h-fit opacity-100 py-1"
                                : "max-h-0 opacity-0"
                            }`}
                          >
                            {item.children.map((child) => {
                              if (child.isHeader) {
                                return (
                                  <div key={child.name}>
                                    <div className="text-xs px-12 h-6 font-semibold text-white select-none flex items-center">
                                      {child.name}
                                    </div>
                                    <ul className="ml-4 flex flex-col gap-1 text-xs h-fit">
                                      {child.children?.map((subChild) => {
                                        const active = isHrefActive(
                                          subChild.href
                                        );
                                        return (
                                          <li key={subChild.name}>
                                            <Link
                                              href={subChild.href!}
                                              onClick={() => {
                                                closeIfMobile();
                                                requestAnimationFrame(
                                                  computeScrollHints
                                                );
                                              }}
                                              onTouchStart={() => {}}
                                              aria-current={
                                                active ? "page" : undefined
                                              }
                                              className={[
                                                "flex items-center px-8 h-8 mx-2 rounded",
                                                active
                                                  ? "bg-white text-black"
                                                  : "hover:bg-white hover:text-hoverText active:bg-white active:text-black focus:bg-white focus:text-hoverText",
                                              ].join(" ")}
                                            >
                                              <span className="whitespace-nowrap overflow-hidden">{subChild.name}</span>
                                            </Link>
                                          </li>
                                        );
                                      })}
                                    </ul>
                                  </div>
                                );
                              }

                              const active = isHrefActive(child.href);
                              return (
                                <li key={child.name}>
                                  <Link
                                    href={child.href!}
                                    onClick={() => {
                                      closeIfMobile();
                                      requestAnimationFrame(computeScrollHints);
                                    }}
                                    onTouchStart={() => {}}
                                    aria-current={active ? "page" : undefined}
                                    className={[
                                      "flex items-center px-8 h-8 mx-2 rounded",
                                      active
                                        ? "bg-white text-black"
                                        : "hover:bg-white hover:text-hoverText active:bg-white active:text-black focus:bg-white focus:text-hoverText",
                                    ].join(" ")}
                                  >
                                    <span className="whitespace-nowrap overflow-hidden">{child.name}</span>
                                  </Link>
                                </li>
                              );
                            })}
                          </ul>
                        </>
                      ) : (
                        (() => {
                          const active = isHrefActive(item.href);
                          return (
                            <Link
                              href={item.href!}
                              onClick={() => {
                                closeIfMobile();
                                requestAnimationFrame(computeScrollHints);
                              }}
                              onTouchStart={() => {}}
                              aria-current={active ? "page" : undefined}
                              className={[
                                "flex items-center px-8 h-12 transform transition-transform duration-200 ease-in-out text-xs mx-2 rounded my-0.5",
                                active
                                  ? "bg-white text-black"
                                  : "hover:bg-white hover:text-hoverText active:bg-white active:text-black focus:bg-white focus:text-hoverText",
                              ].join(" ")}
                            >
                              <span className="mr-3">{item.icon}</span>
                              <span className="flex-1 whitespace-nowrap overflow-hidden">
                                {item.name}
                              </span>
                            </Link>
                          );
                        })()
                      )}
                    </div>
                  );
                })}
            </div>
          </nav>

          {/* Scroll chip (only when at top and more below) */}
          {!collapsed && atTop && showBottomShadow && (
            <div className="pointer-events-none absolute right-3 bottom-[110px] md:bottom-[165px]">
              <div className="flex items-center gap-1 px-2 py-1 rounded-full bg-white/25 text-[8px] uppercase tracking-wide">
                <span>Scroll</span>
                <BiChevronDown size={8} />
              </div>
            </div>
          )}

          {!collapsed && (
            <div
              aria-hidden
              className={`pointer-events-none absolute left-0 right-0 h-4
      transition-opacity duration-200 z-10
      bg-gradient-to-t from-black/50 to-transparent
      ${showBottomShadow ? "opacity-100" : "opacity-0"}
      bottom-[100px] md:bottom-[160px]`}
            />
          )}

          {/* Fixed-bottom sign-out (moved out of <nav/>) */}
          <div className="flex justify-center md:h-[160px] h-[100px]">
            <div
              className="flex items-start transition-all duration-300 ease-in-out cursor-pointer py-4"
            >
              <button
                onClick={handleSignOut}
                disabled={signingOut}
                aria-busy={signingOut}
                className={`flex justify-center items-start transition-colors duration-200 ease-in-out cursor-pointer w-full ${
                  collapsed
                    ? "gap-2 h-10 p-2 rounded hover:bg-white hover:text-hoverText disabled:opacity-60"
                    : "gap-2 h-10 w-fit p-2 border-y-2 border-2 rounded-md border-gray-200 hover:bg-white hover:text-hoverText disabled:opacity-60"
                }`}
              >
                <VscSignOut size={20} />
                {!collapsed && (
                  <span className="ml-2 duration-200 transition-opacity whitespace-nowrap text-sm w-fit">
                    {signingOut ? "Déconnexion..." : "SE DÉCONNECTER"}
                  </span>
                )}
              </button>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
}
