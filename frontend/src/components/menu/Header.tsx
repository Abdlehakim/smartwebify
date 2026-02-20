
import Headertop from "@/components/menu/Headertop";
import HeaderBottom from "@/components/menu/Headerbottom";
import LogoComponent from "@/components/menu/LogoComponent";
import SearchBar from "@/components/menu/SearchBar";
import CartLogic from "@/components/menu/cart/CartLogic";
import Wishlist from "@/components/menu/Wishlist";
import UserMenu from "@/components/user/UserMenu";


const Header = async () => {

  return (
    <>
      <Headertop />
      <div className="w-full h-[80px] bg-primary flex justify-center items-center gap-[16px] border-y border-gray-600">
        <div className="w-[90%] flex justify-between items-center  gap-[16px] ">
          <LogoComponent />
          <SearchBar />
          <div className="flex w-fit">
            <CartLogic />
            <Wishlist />
            <UserMenu/>
          </div>
        </div>
      </div>
      <HeaderBottom />
    </>
  );
};

export default Header;
