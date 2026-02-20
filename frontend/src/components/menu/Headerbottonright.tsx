import Link from 'next/link'
import React from 'react'

const Headerbottonright = () => {
  return (
    
        
          <div className="flex justify-end gap-[8px] xl:gap-[16px]  2xl:gap-[40px] font-semibold items-center text-white   max-xl:text-xs max-lg:hidden">
            <Link className="hover:text-secondary uppercase" href="/promotion">
              PROMOTION
            </Link>
            <Link className="hover:text-secondary uppercase" href="/new-products">
            Nouveau PRODUITS
            </Link>
            <Link className="hover:text-secondary " href="/best-collection">
            MEILLEURE COLLECTION
            </Link>  
            <Link className="hover:text-secondary uppercase" href="/blog">
              BLOG
            </Link>
            <Link className="hover:text-secondary uppercase" href="/contactus">
            CONTACTEZ-NOUS
            </Link>
          </div>
  )
}

export default Headerbottonright