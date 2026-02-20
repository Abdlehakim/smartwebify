
import HeaderBottomBlog from "@/components/menu/blog/HeaderBottomBlog";
import LogoComponent from "@/components/menu/LogoComponent";
import UserMenu from "@/components/user/UserMenu";


const HeaderBlog = async () => {

  return (
    <>
      <div className="w-full h-[80px] bg-primary flex justify-center items-center max-lg:justify-around gap-[16px] border-y border-gray-600">
        <div className="w-[90%] flex justify-between items-center max-lg:justify-around gap-[16px] ">
          <LogoComponent />
          <div className="flex">
            <UserMenu/>
          </div>
        </div>
      </div>
      <HeaderBottomBlog />
    </>
  );
};

export default HeaderBlog;
