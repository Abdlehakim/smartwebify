/* ------------------------------------------------------------------
   src/app.ts – complete Express bootstrap with every explicit import
------------------------------------------------------------------ */

import express, { Request, Response, RequestHandler } from "express";
import cors, { CorsOptions } from "cors";
import cookieParser from "cookie-parser";

/* 1️⃣  ENV + DB --------------------------------------------- */
if (process.env.NODE_ENV !== "production") {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  require("dotenv").config();
}
import "./db"; // side-effect: opens Mongo connection

/* ── Cookie flags for both set & clear ───────────────────────────────── */
export const isProd = process.env.NODE_ENV === "production";
export const COOKIE_DOMAIN = isProd ? ".soukelmeuble.tn" : undefined;

export const COOKIE_OPTS = {
  httpOnly: true,
  secure: isProd,
  sameSite: isProd ? ("none" as const) : ("lax" as const),
  path: "/",
  ...(COOKIE_DOMAIN && { domain: COOKIE_DOMAIN }),
} as const;

/* 2️⃣  EXPRESS CORE ---------------------------------------------------- */
const app = express();
const PORT = process.env.PORT;

/* Trust Render / Heroku proxy so `secure` cookies survive */
app.set("trust proxy", 1);

/* body + cookie parsing */
app.use(express.json());
app.use(cookieParser());

/* 3️⃣  CORS ------------------------------------------------------------ */
const STATIC_ORIGINS = [
  "https://admin.soukelmeuble.tn",
  "https://api.soukelmeuble.tn",
  "https://frontendadmin-navy.vercel.app",
  "http://localhost:3001",
  "http://localhost:3002",
  "https://soukelmeuble.tn",
];
const extra = process.env.EXTRA_CORS_ORIGINS?.split(",").filter(Boolean) ?? [];
const allowed = new Set<string>([...STATIC_ORIGINS, ...extra]);

const corsOptions: CorsOptions = {
  origin: (origin, cb) => {
    if (!origin) return cb(null, true); // Postman / curl
    cb(null, allowed.has(origin));
  },
  credentials: true,
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
  optionsSuccessStatus: 204,
};

app.use(cors(corsOptions));
app.options("*", cors(corsOptions));

/* 4️⃣  ROUTES – MANUAL IMPORT BLOCK ----------------------------------- */
/* ---------- Client Auth ---------- */
import signinClient from "./routes/client/auth/signin";
import authRoutes from "./routes/client/auth/auth";
import signupClient from "./routes/client/auth/signup";
import updateAuth from "./routes/client/settings/updateClientdetails";

/* ---------- Product reviews & similar ---------- */
import PostProductReviews from "./routes/products/PostProductReviews";
import SimilarProduct from "./routes/products/SimilarProduct";
import SearchProduct from "./routes/products/SearchProduct";

/* ---------- Dashboard Payment + Currency settings   ---------- */
import updatePaymentSettings from "./routes/dashboardadmin/payment/payment-settings/updatePaymentSettings";
import getPaymentSettings from "./routes/dashboardadmin/payment/payment-settings/getPaymentSettings";
import getActivePaymentSettings from "./routes/dashboardadmin/payment/payment-settings/getActivePaymentSettings";
import getCurrencySettings from "./routes/dashboardadmin/payment/payment-currency/getCurrencySettings";
import updateCurrencySettings from "./routes/dashboardadmin/payment/payment-currency/updateCurrencySettings";
import getPrimaryCurrency from "./routes/website/currency/getPrimaryCurrency";

/* ----------  Website / checkout ---------- */
import getAllDeliveryOptionWeb from "./routes/website/checkout/getAllDeliveryOption";
import getAllAprovedMagasinWeb from "./routes/website/checkout/getAllAprovedMagasin";
import getPaymentMethode from "./routes/website/checkout/getPaymentMethode";

/* ---------- HomePage, nav, banners ---------- */
import productRoutes from "./routes/homePage/productsRoutes";
import categorieRoutes from "./routes/NavMenu/categoriesRoutes";
import brandsRoutes from "./routes/homePage/brandsRoutes";
import storesRoutes from "./routes/homePage/storesRoutes";
import contactUsRoutes from "./routes/NavMenu/contactUsRoutes";
import HomeBanner from "./routes/homePage/HomeBanner";
import categorieSubCategoriePage from "./routes/NavMenu/categorieSubCategoriePage";
import ProductPromotion from "./routes/NavMenu/ProductPromotion";
import NewProducts from "./routes/NavMenu/newProducts";
import BestProductCollection from "./routes/NavMenu/BestProductCollection";
import productsByStatus from "./routes/NavMenu/productsByStatus";

/* ---------- header Website / sections ---------- */
import GetHeadertopData from "./routes/website/header/getHeadertopData";
import GetHeaderData from "./routes/website/header/getHeaderData";
import GetFooterData from "./routes/website/header/getFooterData";

/* ---------- Product detail / sections ---------- */
import MainProductSection from "./routes/products/MainProductSection";
import ProductDetails from "./routes/products/ProductDetails";
import ProductReviews from "./routes/products/ProductReviews";

/* ---------- Blog (public) ---------- */
import postsRoutes from "./routes/blog/postsRoutes";
import PostCardData from "./routes/blog/PostCardData";
import PostCardDataByCategorie from "./routes/blog/PostCardDataByCategorie";
import getAllPostCardData from "./routes/website/blog/getAllPostCardData";
import getAllPostCardByCategorie from "./routes/website/blog/getAllPostCardByCategorie";
import getAllPostCardBySubCategorie from "./routes/website/blog/getAllPostCardBySubCategorie";
import getPostDataBySlug from "./routes/website/blog/getPostDataBySlug";
import getSimilarPostBySlug from "./routes/website/blog/getSimilarPostBySlug";
import postCategories from "./routes/website/blog/postCategories";

/* ---------- Client orders / address ---------- */
import getOrderByRef from "./routes/client/order/getOrderByRef";
import postOrderClient from "./routes/client/order/postOrderClient";
import getOrdersByClient from "./routes/client/order/getOrdersByClient";
import getClientAddress from "./routes/client/address/getAddress";
import postClientAddress from "./routes/client/address/PostAddress";
import updateClienAddressById from "./routes/client/address/updateAddressById";
import deleteClientAddress from "./routes/client/address/deleteAddress";

/* ═════════════ Dashboard Admin (auth) ═════════════ */
import signinDashboardAdmin from "./routes/dashboardadmin/users/dashboardSignin";
import dashboardAuth from "./routes/dashboardadmin/users/dashboardAuth";
import createdUser from "./routes/dashboardadmin/users/createUser";
import deleteUser from "./routes/dashboardadmin/users/deleteUser";
import getAllUsersWithRole from "./routes/dashboardadmin/users/getAllUsersWithRole";
import updateUserDashboard from "./routes/dashboardadmin/users/updateUserDashboard";
import getUserById from "./routes/dashboardadmin/users/getUserById";

/* ---------- Dashboard Roles & Permissions ---------- */
import createRoles from "./routes/dashboardadmin/roles/createRoles";
import getAllRoles from "./routes/dashboardadmin/roles/getAllRoles";
import updateUserRole from "./routes/dashboardadmin/roles/updateUserRole";
import DeleteRole from "./routes/dashboardadmin/roles/deleteRoles";
import getAllPermission from "./routes/dashboardadmin/roles/getAllPermission";
import updateRolePermissions from "./routes/dashboardadmin/roles/updateRolePermissions";

/* ---------- Dashboard Clients & Orders ---------- */
import getAllClient from "./routes/dashboardadmin/client/getAllClient";
import findClient from "./routes/dashboardadmin/client/findClient";
import deleteClient from "./routes/dashboardadmin/client/deleteClient";
import getAllOrders from "./routes/dashboardadmin/orders/getAllOrders";
import getOne from "./routes/dashboardadmin/orders/getOne";
import getOrderById from "./routes/dashboardadmin/orders/getOrderById";
import submitOrder from "./routes/dashboardadmin/orders/submitOrder";
import updateOrder from "./routes/dashboardadmin/orders/updateOrder";
import updateOrderStatus from "./routes/dashboardadmin/orders/updateOrderStatus";

/* ---------- Dashboard Clients & factures ---------- */
import getAllfactures from "@/routes/dashboardadmin/factures/getAllfactures";
import updateFactureStatus from "@/routes/dashboardadmin/factures/updateStatus";
import getFcById from "@/routes/dashboardadmin/factures/getFcById";
import createFacture from "@/routes/dashboardadmin/factures/createFacture";
import createFcFromOrder from "@/routes/dashboardadmin/factures/createFcFromOrder";
import pendingInvoices from "@/routes/dashboardadmin/factures/pendingInvoices";
import deleteFactures from "@/routes/dashboardadmin/factures/deleteFactures";
import counter from "@/routes/dashboardadmin/factures/counter";



/* ---------- Dashboard Clients shops ---------- */
import getAllClientShop from "./routes/dashboardadmin/client-shop/getAllClientShop";
import createClientShop from "./routes/dashboardadmin/client-shop/createClientShop";
import updateClientShop from "./routes/dashboardadmin/client-shop/updateClientShop";
import deleteClientShop from "./routes/dashboardadmin/client-shop/deleteClientShop";

/* ---------- Dashboard Clients company ---------- */
import getAllClientCompany from "./routes/dashboardadmin/client-company/getAllClientCompany";
import createClientCompany from "./routes/dashboardadmin/client-company/createClientCompany";
import updateClientCompany from "./routes/dashboardadmin/client-company/updateClientCompany";
import deleteClientCompany from "./routes/dashboardadmin/client-company/deleteClientCompany";


/* ---------- Dashboard Clients address ---------- */
import getAddressByClient from "./routes/dashboardadmin/address/getAddressByClient";
import updateAddressById from "./routes/dashboardadmin/address/updateAddressById";
import deleteAddress from "./routes/dashboardadmin/address/deleteAddress";
import PostAddress from "./routes/dashboardadmin/address/PostAddress";

/* ---------- Dashboard Delivery Options ---------- */
import createDeliveryOption    from "./routes/dashboardadmin/delivery-options/createDeliveryOption";
import getAllDeliveryOptions   from "./routes/dashboardadmin/delivery-options/getAllDeliveryOption";
import getDeliveryOptions   from "./routes/dashboardadmin/delivery-options/getDeliveryOptions";
import getDeliveryOptionById   from "./routes/dashboardadmin/delivery-options/getDeliveryOptionById";
import updateDeliveryOption    from "./routes/dashboardadmin/delivery-options/updateDeliveryOption";
import deleteDeliveryOption    from "./routes/dashboardadmin/delivery-options/deleteDeliveryOption";

/* payment flags */
app.use("/api/dashboardadmin/payment/payment-settings", updatePaymentSettings);
app.use("/api/dashboardadmin/payment/payment-settings", getPaymentSettings);
app.use("/api/dashboardadmin/payment/payment-settings", getActivePaymentSettings);
app.use("/api/dashboardadmin/payment/payment-currency", getCurrencySettings);
app.use("/api/dashboardadmin/payment/payment-currency", updateCurrencySettings)
app.use("/api/website/currency/primary", getPrimaryCurrency);



/* ---------- Dashboard Stock: Products ---------- */
import addNewProduct from "./routes/dashboardadmin/stock/allproducts/addNewProduct";
import deleteProduct from "./routes/dashboardadmin/stock/allproducts/deleteProduct";
import getAllProducts from "./routes/dashboardadmin/stock/allproducts/getAllProducts";
import searchProduct from "./routes/dashboardadmin/stock/allproducts/searchProduct";
import updateProduct from "./routes/dashboardadmin/stock/allproducts/updateProduct";
import getProductById from "./routes/dashboardadmin/stock/allproducts/getProductById";

/* ---------- Dashboard Stock: Product Attributes ---------- */
import addNewProductAttribute from "./routes/dashboardadmin/stock/productattribute/addNewProductAttribute";
import deleteProductAttribute from "./routes/dashboardadmin/stock/productattribute/deleteProductAttribute";
import getAllProductAttribute from "./routes/dashboardadmin/stock/productattribute/getAllProductAttribute";
import getProductAttributeById from "./routes/dashboardadmin/stock/productattribute/getProductAttributeById";
import updateProductAttribute from "./routes/dashboardadmin/stock/productattribute/updateProductAttribute";

/* ---------- Dashboard Stock: Brands ---------- */
import addNewBrand from "./routes/dashboardadmin/stock/brands/addNewBrand";
import deleteBrand from "./routes/dashboardadmin/stock/brands/deleteBrand";
import getAllBrands from "./routes/dashboardadmin/stock/brands/getAllBrands";
import updateBrand from "./routes/dashboardadmin/stock/brands/updateBrand";
import getBrandById from "./routes/dashboardadmin/stock/brands/getBrandById";

/* ---------- Dashboard Stock: Categories ---------- */
import addNewCategorie from "./routes/dashboardadmin/stock/categories/addNewCategorie";
import deleteCategorie from "./routes/dashboardadmin/stock/categories/deleteCategorie";
import getAllCategories from "./routes/dashboardadmin/stock/categories/getAllCategories";
import updateCategorie from "./routes/dashboardadmin/stock/categories/updateCategorie";
import getCategorieById from "./routes/dashboardadmin/stock/categories/getCategorieById";

/* ---------- Dashboard Stock: Sub-categories ---------- */
import addNewSubCategorie from "./routes/dashboardadmin/stock/subcategories/addNewSubCategorie";
import deleteSubCategorie from "./routes/dashboardadmin/stock/subcategories/deleteSubCategorie";
import getAllSubCategories from "./routes/dashboardadmin/stock/subcategories/getAllSubCategories";
import updateSubCategorie from "./routes/dashboardadmin/stock/subcategories/updateSubCategorie";
import getSubCategorieById from "./routes/dashboardadmin/stock/subcategories/getSubCategorieById";

/* ---------- Dashboard Stock: Magasins ---------- */
import addNewMagasin from "./routes/dashboardadmin/stock/magasins/addNewMagasin";
import deleteMagasin from "./routes/dashboardadmin/stock/magasins/deleteMagasin";
import getAllMagasins from "./routes/dashboardadmin/stock/magasins/getAllMagasins";
import getMagasins from "./routes/dashboardadmin/stock/magasins/getMagasins";
import updateMagasin from "./routes/dashboardadmin/stock/magasins/updateMagasin";
import getMagasinById from "./routes/dashboardadmin/stock/magasins/getMagasinById";

/* ---------- Dashboard Website Data ---------- */
import createHomePageData from "./routes/dashboardadmin/website/homepage/createhomePageData";
import getHomePageData from "./routes/dashboardadmin/website/homepage/gethomePageData";
import updateHomePageData from "./routes/dashboardadmin/website/homepage/updatehomePageData";

import CreateWebsiteTitres from "./routes/dashboardadmin/website/website-titres/CreateWebsiteTitres";
import GetWebsiteTitres    from "./routes/dashboardadmin/website/website-titres/GetWebsiteTitres";
import updateWebsiteTitres from "./routes/dashboardadmin/website/website-titres/updateWebsiteTitres";

import createCompanyInfo from "./routes/dashboardadmin/website/company-info/createCompanyInfo";
import getCompanyInfo from "./routes/dashboardadmin/website/company-info/getCompanyInfo";
import updateCompanyInfo from "./routes/dashboardadmin/website/company-info/updateCompanyInfo";

import createBanners from "./routes/dashboardadmin/website/banners/createBanners";
import getBanners from "./routes/dashboardadmin/website/banners/getBanners";
import updateBanners from "./routes/dashboardadmin/website/banners/updateBanners";

/* ---------- Dashboard Blog ---------- */
import createPostCategorie from "./routes/dashboardadmin/blog/postcategorie/createPostCategorie";
import deletePostCategorie from "./routes/dashboardadmin/blog/postcategorie/deletePostCategorie";
import getAllPostCategorie from "./routes/dashboardadmin/blog/postcategorie/getAllPostCategorie";
import updatePostCategorie from "./routes/dashboardadmin/blog/postcategorie/updatePostCategorie";
import getPostCategorieById from "./routes/dashboardadmin/blog/postcategorie/getPostCategorieById";

import createPostSubCategorie from "./routes/dashboardadmin/blog/postsubcategorie/createPostSubCategorie";
import deletePostSubCategorie from "./routes/dashboardadmin/blog/postsubcategorie/deletePostSubCategorie";
import getAllPostSubCategorie from "./routes/dashboardadmin/blog/postsubcategorie/getAllPostSubCategorie";
import updatePostSubCategorie from "./routes/dashboardadmin/blog/postsubcategorie/updatePostSubCategorie";
import getPostSubCategorieById from "./routes/dashboardadmin/blog/postsubcategorie/getPostSubCategorieById";
import getPostSubCategroietByParent from "./routes/dashboardadmin/blog/postsubcategorie/getPostSubCategroietByParent";

import createPost from "./routes/dashboardadmin/blog/post/createPost";
import deletePost from "./routes/dashboardadmin/blog/post/deletePost";
import getAllPost from "./routes/dashboardadmin/blog/post/getAllPost";
import getPostById from "./routes/dashboardadmin/blog/post/getPostById";
import updatePost from "./routes/dashboardadmin/blog/post/updatePost";

import invoicePdfRouter from "@/routes/pdf/invoicePdf";
import { invoiceZipRouter } from "@/routes/pdf/invoiceZip";

/* 5️⃣  MOUNT PATHS (client) -------------------------------------------- */
app.use("/api/signin", signinClient);
app.use("/api/auth", authRoutes);
app.use("/api/signup", signupClient);
app.use("/api/clientSetting", updateAuth);

app.use("/api/reviews", PostProductReviews);
app.use("/api/products", productRoutes);
app.use("/api/categories", categorieRoutes);
app.use("/api/brands", brandsRoutes);
app.use("/api/store", storesRoutes);
app.use("/api/HomePageBanner", HomeBanner);
app.use("/api/products/SimilarProduct", SimilarProduct);
app.use("/api/products", SearchProduct);
app.use("/api/products/MainProductSection", MainProductSection);
app.use("/api/products/ProductDetails", ProductDetails);
app.use("/api/products/ProductReviews", ProductReviews);

app.use("/api/NavMenu/categorieSubCategoriePage", categorieSubCategoriePage);
app.use("/api/NavMenu/contactus", contactUsRoutes);
app.use("/api/NavMenu/ProductPromotion", ProductPromotion);
app.use("/api/NavMenu/NewProducts", NewProducts);
app.use("/api/NavMenu/BestProductCollection", BestProductCollection);
app.use("/api/NavMenu/products", productsByStatus);

app.use("/api/blog", postsRoutes);
app.use("/api/blog", PostCardData);
app.use("/api/blog", PostCardDataByCategorie);
app.use("/api/blog/getAllPostCardData", getAllPostCardData);
app.use("/api/blog", getAllPostCardByCategorie);
app.use("/api/blog", getAllPostCardBySubCategorie);
app.use("/api/blog", getPostDataBySlug);
app.use("/api/blog", getSimilarPostBySlug);
app.use("/api/blog", postCategories);

app.use("/api/client/order", getOrderByRef);
app.use("/api/client/order", postOrderClient);
app.use("/api/client/order", getOrdersByClient);
app.use("/api/client/address", getClientAddress);
app.use("/api/client/address", postClientAddress);
app.use("/api/client/address", updateClienAddressById);
app.use("/api/client/address", deleteClientAddress);

/* ----------  Website / checkout ---------- */

app.use("/api/checkout/delivery-options", getAllDeliveryOptionWeb);
app.use("/api/checkout/Magasin-options", getAllAprovedMagasinWeb);
app.use("/api/checkout/payment-methods", getPaymentMethode);

/* ---------- header Website / sections ---------- */

app.use("/api/website/header/", GetHeadertopData);
app.use("/api/website/header/", GetHeaderData);
app.use("/api/website/header/", GetFooterData);

/* ---------- Dashboard paths (auth, users, roles, stock, etc.) --------- */
app.use("/api/signindashboardadmin", signinDashboardAdmin);
app.use("/api/dashboardAuth", dashboardAuth);
app.use("/api/dashboardadmin/users", updateUserDashboard);
app.use("/api/dashboardadmin/users", createdUser);
app.use("/api/dashboardadmin/users", deleteUser);
app.use("/api/dashboardadmin/users", getUserById);
app.use("/api/dashboardadmin/getAllUsersWithRole", getAllUsersWithRole);
app.use("/api/dashboardadmin/getAllPermission", getAllPermission);

/* roles block */
app.use("/api/dashboardadmin/roles", createRoles);
app.use("/api/dashboardadmin/roles", getAllRoles);
app.use("/api/dashboardadmin/roles", updateUserRole);
app.use("/api/dashboardadmin/roles", DeleteRole);
app.use("/api/dashboardadmin/roles", updateRolePermissions);

/* client website */
app.use("/api/dashboardadmin/client", getAllClient);
app.use("/api/dashboardadmin/client", findClient);
app.use("/api/dashboardadmin/client", deleteClient);

/* client shop */
app.use("/api/dashboardadmin/clientShop", createClientShop);
app.use("/api/dashboardadmin/clientShop", getAllClientShop);
app.use("/api/dashboardadmin/clientShop", deleteClientShop);
app.use("/api/dashboardadmin/clientShop", updateClientShop);

/* client Company */
app.use("/api/dashboardadmin/clientCompany", createClientCompany);
app.use("/api/dashboardadmin/clientCompany", getAllClientCompany);
app.use("/api/dashboardadmin/clientCompany", updateClientCompany);
app.use("/api/dashboardadmin/clientCompany", deleteClientCompany);

/* Dashboard client address */
app.use("/api/dashboardadmin/clientAddress", getAddressByClient);
app.use("/api/dashboardadmin/clientAddress", updateAddressById);
app.use("/api/dashboardadmin/clientAddress", deleteAddress);
app.use("/api/dashboardadmin/clientAddress", PostAddress);

/* orders */
app.use("/api/dashboardadmin/orders", getAllOrders);
app.use("/api/dashboardadmin/orders", getOne);
app.use("/api/dashboardadmin/orders", getOrderById);
app.use("/api/dashboardadmin/orders", submitOrder);
app.use("/api/dashboardadmin/orders", updateOrder);
app.use("/api/dashboardadmin/orders", updateOrderStatus);

/* factures */
app.use("/api/dashboardadmin/factures", getAllfactures);
app.use("/api/dashboardadmin/factures", deleteFactures);
app.use("/api/dashboardadmin/factures", updateFactureStatus);
app.use("/api/dashboardadmin/factures", getFcById);
app.use("/api/dashboardadmin/factures", createFacture);
app.use("/api/dashboardadmin/factures", createFcFromOrder);
app.use("/api/dashboardadmin/factures", pendingInvoices);
app.use("/api/dashboardadmin/factures/counter", counter);


/* delivery options */
app.use("/api/dashboardadmin/delivery-options", createDeliveryOption);
app.use("/api/dashboardadmin/delivery-options", getAllDeliveryOptions);
app.use("/api/dashboardadmin/delivery-options", getDeliveryOptions);
app.use("/api/dashboardadmin/delivery-options", getDeliveryOptionById);
app.use("/api/dashboardadmin/delivery-options", updateDeliveryOption);
app.use("/api/dashboardadmin/delivery-options", deleteDeliveryOption);

/* stock: products & attributes */
app.use("/api/dashboardadmin/stock/products", addNewProduct);
app.use("/api/dashboardadmin/stock/products", deleteProduct);
app.use("/api/dashboardadmin/stock/products", getAllProducts);
app.use("/api/dashboardadmin/stock/products", searchProduct);
app.use("/api/dashboardadmin/stock/products", updateProduct);
app.use("/api/dashboardadmin/stock/products", getProductById);

app.use("/api/dashboardadmin/stock/productattribute", addNewProductAttribute);
app.use("/api/dashboardadmin/stock/productattribute", getAllProductAttribute);
app.use("/api/dashboardadmin/stock/productattribute", deleteProductAttribute);
app.use("/api/dashboardadmin/stock/productattribute", getProductAttributeById);
app.use("/api/dashboardadmin/stock/productattribute", updateProductAttribute);

/* stock: brands */
app.use("/api/dashboardadmin/stock/brands", addNewBrand);
app.use("/api/dashboardadmin/stock/brands", deleteBrand);
app.use("/api/dashboardadmin/stock/brands", getAllBrands);
app.use("/api/dashboardadmin/stock/brands", updateBrand);
app.use("/api/dashboardadmin/stock/brands", getBrandById);

/* stock: categories */
app.use("/api/dashboardadmin/stock/categories", addNewCategorie);
app.use("/api/dashboardadmin/stock/categories", deleteCategorie);
app.use("/api/dashboardadmin/stock/categories", getAllCategories);
app.use("/api/dashboardadmin/stock/categories", updateCategorie);
app.use("/api/dashboardadmin/stock/categories", getCategorieById);

/* stock: sub-categories */
app.use("/api/dashboardadmin/stock/subcategories", addNewSubCategorie);
app.use("/api/dashboardadmin/stock/subcategories", deleteSubCategorie);
app.use("/api/dashboardadmin/stock/subcategories", getAllSubCategories);
app.use("/api/dashboardadmin/stock/subcategories", updateSubCategorie);
app.use("/api/dashboardadmin/stock/subcategories", getSubCategorieById);

/* stock: magasins */
app.use("/api/dashboardadmin/stock/magasins", addNewMagasin);
app.use("/api/dashboardadmin/stock/magasins", deleteMagasin);
app.use("/api/dashboardadmin/stock/magasins", getAllMagasins);
app.use("/api/dashboardadmin/stock/magasins", getMagasins);
app.use("/api/dashboardadmin/stock/magasins", updateMagasin);
app.use("/api/dashboardadmin/stock/magasins", getMagasinById);

/* website data */
app.use("/api/dashboardadmin/website/homepage", createHomePageData);
app.use("/api/dashboardadmin/website/homepage", getHomePageData);
app.use("/api/dashboardadmin/website/homepage", updateHomePageData);

app.use("/api/dashboardadmin/website", CreateWebsiteTitres);
app.use("/api/dashboardadmin/website", GetWebsiteTitres);
app.use("/api/dashboardadmin/website", updateWebsiteTitres);

app.use("/api/dashboardadmin/website/company-info", createCompanyInfo);
app.use("/api/dashboardadmin/website/company-info", getCompanyInfo);
app.use("/api/dashboardadmin/website/company-info", updateCompanyInfo);

app.use("/api/dashboardadmin/website/banners", createBanners);
app.use("/api/dashboardadmin/website/banners", getBanners);
app.use("/api/dashboardadmin/website/banners", updateBanners);

/* blog */
app.use("/api/dashboardadmin/blog/postcategorie", createPostCategorie);
app.use("/api/dashboardadmin/blog/postcategorie", deletePostCategorie);
app.use("/api/dashboardadmin/blog/postcategorie", getAllPostCategorie);
app.use("/api/dashboardadmin/blog/postcategorie", updatePostCategorie);
app.use("/api/dashboardadmin/blog/postcategorie", getPostCategorieById);

app.use("/api/dashboardadmin/blog/postsubcategorie", createPostSubCategorie);
app.use("/api/dashboardadmin/blog/postsubcategorie", deletePostSubCategorie);
app.use("/api/dashboardadmin/blog/postsubcategorie", getAllPostSubCategorie);
app.use("/api/dashboardadmin/blog/postsubcategorie", updatePostSubCategorie);
app.use("/api/dashboardadmin/blog/postsubcategorie", getPostSubCategorieById);
app.use(
  "/api/dashboardadmin/blog/postsubcategorie",
  getPostSubCategroietByParent
);

app.use("/api/dashboardadmin/blog/post", createPost);
app.use("/api/dashboardadmin/blog/post", deletePost);
app.use("/api/dashboardadmin/blog/post", getAllPost);
app.use("/api/dashboardadmin/blog/post", getPostById);
app.use("/api/dashboardadmin/blog/post", updatePost);

app.use("/api/pdf", invoicePdfRouter);
app.use("/api/zip", invoiceZipRouter);

/* 6️⃣  Health checks + 404 --------------------------------------------- */
const apiHealth: RequestHandler = (_req, res) => {
  res.json({ message: "API is running" });
};

const rootHealth: RequestHandler = (_req, res) => {
  res.json({ message: "Server is running" });
};

app.get("/api", apiHealth);
app.get("/", rootHealth);

/* 404 catch-all */
const notFound: RequestHandler = (_req, res) => {
  res.status(404).json({ message: "Not found" });
};
app.use("*", notFound);

/* 7️⃣  Permission & role bootstrap ------------------------------------- */
import { createOrUpdatePermissions } from "./scripts/createOrUpdatePermissions";
import { initializeDefaultRoles } from "./scripts/initRoles";
import createSuperAdminAccount from "./scripts/initSuperAdmin";
import initPaymentSettings         from "./scripts/initPaymentMethods";
import initCurrencySettings from "./scripts/initCurrencySettings";

(async () => {
  try {
    if (await createOrUpdatePermissions()) {
      await initializeDefaultRoles();
    }
    await createSuperAdminAccount();
    await initPaymentSettings();
    await initCurrencySettings();

    app.listen(PORT, () =>
      console.log(`🚀  Server listening on http://localhost:${PORT}`)
    );
  } catch (err) {
    console.error("❌  Startup error:", err);
    process.exit(1);
  }
})();
