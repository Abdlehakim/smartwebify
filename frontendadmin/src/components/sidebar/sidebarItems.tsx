import React from "react";
import { MdOutlineDashboard } from "react-icons/md";
import { FaUsersViewfinder, FaRegMoneyBill1 } from "react-icons/fa6";
import { LuCircleParking } from "react-icons/lu";
import { PiArticleMediumBold, PiUsersThree } from "react-icons/pi";
import { CgWebsite } from "react-icons/cg";
import { TbTruckDelivery } from "react-icons/tb";

/* Keep a local copy of the shape for typing this file's export */
interface SidebarItem {
  name: string;
  href?: string;
  icon?: React.ReactElement;
  permission?: string;
  children?: SidebarItem[];
  isHeader?: boolean;
}

export const sidebarItems: SidebarItem[] = [
  {
    name: "Tableau de bord",
    href: "/dashboard",
    icon: <MdOutlineDashboard size={20} />,
  },
  {
    name: "Gestion des accès",
    icon: <FaUsersViewfinder size={20} />,
    permission: "M_Access",
    children: [
      {
        name: "Utilisateurs",
        href: "/dashboard/manage-access/users",
        icon: <FaUsersViewfinder size={20} />,
      },
      {
        name: "Rôles",
        href: "/dashboard/manage-access/roles",
        icon: <FaUsersViewfinder size={20} />,
      },
    ],
  },
  {
    name: "Gestion du site",
    icon: <CgWebsite size={20} />,
    children: [
            {
        name: "Données de l'Entreprise",
        href: "/dashboard/manage-website/company-data",
        icon: <LuCircleParking size={20} />,
      },
      {
        name: "Données page d'accueil",
        href: "/dashboard/manage-website/home-page",
        icon: <LuCircleParking size={20} />,
      },
      {
        name: "Bannières",
        href: "/dashboard/manage-website/banners",
        icon: <LuCircleParking size={20} />,
      },
      {
        name: "Titres et sous-titres",
        href: "/dashboard/manage-website/titres-soustitres",
        icon: <LuCircleParking size={20} />,
      },
    ],
  },
  {
    name: "Gestion du stock",
    icon: <LuCircleParking size={20} />,
    children: [
      {
        name: "Magasins",
        href: "/dashboard/manage-stock/magasins",
        icon: <LuCircleParking size={20} />,
      },
      {
        name: "Marques",
        href: "/dashboard/manage-stock/brands",
        icon: <LuCircleParking size={20} />,
      },
      {
        name: "Catégories",
        href: "/dashboard/manage-stock/categories",
        icon: <LuCircleParking size={20} />,
      },
      {
        name: "Sous-catégories",
        href: "/dashboard/manage-stock/sub-categories",
        icon: <LuCircleParking size={20} />,
      },
      {
        name: "Attributs produits",
        href: "/dashboard/manage-stock/product-attributes",
        icon: <LuCircleParking size={20} />,
      },
      {
        name: "Tous les produits",
        href: "/dashboard/manage-stock/products",
        icon: <LuCircleParking size={20} />,
      },
    ],
  },
  {
    name: "Gestion des clients",
    icon: <PiUsersThree size={20} />,
    children: [
      {
        name: "Clients",
        isHeader: true,
        children: [
          {
            name: "Site web",
            href: "/dashboard/manage-client/clients",
            icon: <LuCircleParking size={20} />,
          },
          {
            name: "Passage",
            href: "/dashboard/manage-client/clients-shop",
            icon: <LuCircleParking size={20} />,
          },
          {
            name: "Société",
            href: "/dashboard/manage-client/client-company",
            icon: <LuCircleParking size={20} />,
          },
        ],
      },
      {
        name: "Commandes",
        href: "/dashboard/manage-client/orders",
        icon: <LuCircleParking size={20} />,
      },
      {
        name: "Factures",
        href: "/dashboard/manage-client/factures",
        icon: <LuCircleParking size={20} />,
      },
    ],
  },
  {
    name: "Options de paiement",
    icon: <FaRegMoneyBill1 size={20} />,
    children: [
      {
        name: "Méthodes de paiement",
        href: "/dashboard/payment-options/payment-methods",
        icon: <LuCircleParking size={20} />,
      },
      {
        name: "Devise",
        href: "/dashboard/payment-options/currency",
        icon: <LuCircleParking size={20} />,
      },
    ],
  },
  {
    name: "Options de livraison",
    href: "/dashboard/delivery-options",
    icon: <TbTruckDelivery size={20} />,
  },
  {
    name: "Blog",
    icon: <PiArticleMediumBold size={20} />,
    children: [
      {
        name: "Catégories",
        href: "/dashboard/blog/postcategorie",
        icon: <PiArticleMediumBold size={20} />,
      },
      {
        name: "Sous-catégories",
        href: "/dashboard/blog/postsubcategorie",
        icon: <PiArticleMediumBold size={20} />,
      },
      {
        name: "Articles",
        href: "/dashboard/blog/articles",
        icon: <PiArticleMediumBold size={20} />,
      },
    ],
  },
];
