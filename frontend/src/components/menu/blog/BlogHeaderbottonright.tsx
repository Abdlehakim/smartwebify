import Link from "next/link";
import React from "react";

const Headerbottonright = () => {
  return (
    <div className="flex justify-end gap-[8px] xl:gap-[16px]  2xl:gap-[40px] font-semibold items-center text-white   max-xl:text-xs max-lg:hidden">
      <Link className="hover:text-secondary uppercase" href="/blog">
        Blog
      </Link>
      <Link className="hover:text-secondary uppercase" href="/">
        Voir Notre Magasin
      </Link>
      <Link className="hover:text-secondary uppercase" href="/contactus">
        CONTACTEZ-NOUS
      </Link>
    </div>
  );
};

export default Headerbottonright;
