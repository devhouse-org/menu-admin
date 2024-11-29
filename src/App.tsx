import { Route, Routes } from "react-router-dom";
// import Layout from "./Layout"; // Import the MainLayout component
import Home from "./pages/Home/home";
import Restaurant from "./pages/Restaurant/restaurant";
import EditRestaurant from "./pages/Restaurant/EditRestaurant";
import Category from "./pages/Category/category";
import Item from "./pages/Items/item";
import CustomerReview from "./pages/CustomerReview/CustomerReview";
// import Rating from "./pages/Rating/rating";
import Questions from "./pages/Questions/questions";

// import Theme from "./pages/Theme/theme";
// import EditRating from "./pages/Rating/EditRating";
import EditCustomerReview from "./pages/CustomerReview/EditCustomerReview";
import EditCategory from "./pages/Category/EditCategory";
import EditItmes from "./pages/Items/EditItmes";
import EditQuestion from "./pages/Questions/EditQuestion";
import AddItem from "./pages/Items/AddItem";
import AddCustomerReview from "./pages/CustomerReview/AddCustomerReview";
// import AddRating from "./pages/Rating/AddRating";
import AddRestaurant from "./pages/Restaurant/AddRestaurant";
import AddCategory from "./pages/Category/AddCategory";
import AddQuestion from "./pages/Questions/AddQuestion";
// import EditTheme from "./pages/Theme/editTheme";
// import AddTheme from "./pages/Theme/AddTheme";
import DeletedItems from "./pages/Items/Deleteditems";
import DeletedCategories from "./pages/Category/DeletedCategory";
import DeletedQuestions from "./pages/Questions/DeletedQuestion";
// import DeletedThemes from "./pages/Theme/DeletedTheme";
import DeletedRestaurant from "./pages/Restaurant/DeletedRestaurant";
import DeletedReview from "./pages/CustomerReview/DeletedReview";
// import DeletedRating from "./pages/Rating/DeletedRating";
import Login from "./pages/Login/Login";
import Layout from "./components/Layout";
import ProtectedRoute from "./middlewares/ProtectedRoute";
import ImportItem from "./pages/Items/Import";
import ImportCategory from "./pages/Category/ImportCategory";
import ImportRestaurant from "./pages/Restaurant/ImportRestauarnt";
// import ImportTheme from "./pages/Theme/ImportTheme";
// import ImportRating from "./pages/Rating/ImportRating";
import ImportQuestion from "./pages/Questions/ImportQuestion";
import ImportCustomerReview from "./pages/CustomerReview/ImportCustomerReview";
import Addoffer from "./pages/Offers/Addoffer";
import Editoffer from "./pages/Offers/Editoffer";
import Offers from "./pages/Offers/Offers";
import DeletedOffers from "./pages/Offers/DeletedOffers";
import SendOffer from "./pages/Offers/SendOffer";
import Deals from "./pages/Deals/Deals";
import AddDeal from "./pages/Deals/AddDeal";
import EditDeal from "./pages/Deals/EditDeal";
import DeletedDeals from "./pages/Deals/DeletedDeals";
import AddTranslation from "./pages/translation/add";

function App() {
  return (
    <Routes>
      <>
        {/* Routes without Sidebar */}
        <Route path="/login" element={<Login />} />

        {/* Routes with Sidebar */}
        <Route
          element={
            <ProtectedRoute>
              <Layout />
            </ProtectedRoute>
          }
        >
          {/* <Route element={<Layout />}> */}
          {/* home */}
          <Route path="/" element={<Home />} />
          <Route path="/home" element={<Home />} />
          {/* end home */}

          {/* restaurant */}
          <Route path="/restaurants/*">
            <Route index element={<Restaurant />} />
            <Route path="edit/:restaurantId" element={<EditRestaurant />} />
            <Route path="add" element={<AddRestaurant />} />
            <Route path="trash" element={<DeletedRestaurant />} />
            <Route path="import" element={<ImportRestaurant />} />
          </Route>
          {/*end  restaurant */}

          {/* rating */}
          {/* <Route path="/ratings/*">
            <Route index element={<Rating />} />
            <Route path="edit/:ratingId" element={<EditRating />} />
            <Route path="add" element={<AddRating />} />
            <Route path="trash" element={<DeletedRating />} />
            <Route path="import" element={<ImportRating />} />
          </Route> */}
          {/* end rating */}

          {/* customerReviews */}
          <Route path="/customerReviews/*">
            <Route index element={<CustomerReview />} />
            <Route
              path="edit/:customerReviewId"
              element={<EditCustomerReview />}
            />
            <Route path="add" element={<AddCustomerReview />} />
            <Route path="trash" element={<DeletedReview />} />
            <Route path="import" element={<ImportCustomerReview />} />
          </Route>
          {/*end  customerReview */}

          {/* category */}
          <Route path="/categories/*">
            <Route index element={<Category />} />
            <Route path="edit/:categoryId" element={<EditCategory />} />
            <Route path="add" element={<AddCategory />} />
            <Route path="trash" element={<DeletedCategories />} />
            <Route path="import" element={<ImportCategory />} />
          </Route>
          {/*end  category */}

          {/* items */}
          <Route path="/items/*">
            <Route index element={<Item />} />
            <Route path="import" element={<ImportItem />} />
            <Route path="edit/:itemId" element={<EditItmes />} />
            <Route path="add" element={<AddItem />} />
            <Route path="trash" element={<DeletedItems />} />
            <Route path="import" element={<ImportItem />} />
          </Route>
          {/*end items */}

          {/* questions */}
          <Route path="/questions/*">
            <Route index element={<Questions />} />
            <Route path="edit/:questionId" element={<EditQuestion />} />
            <Route path="add" element={<AddQuestion />} />
            <Route path="trash" element={<DeletedQuestions />} />
            <Route path="import" element={<ImportQuestion />} />
          </Route>

          {/* end questions */}
          {/* questions */}
          <Route path="/offers/*">
            <Route index element={<Offers />} />
            <Route path="trash" element={<DeletedOffers />} />
            <Route path="add" element={<Addoffer />} />
            <Route path="edit/:offerId" element={<Editoffer />} />
            <Route path="send/:offerId" element={<SendOffer />} />
          
          </Route>

          {/* themes */}
          {/* <Route path="/themes/*">
            <Route index element={<Theme />} />
            <Route path="add" element={<AddTheme />} />
            <Route path="trash" element={<DeletedThemes />} />
            <Route path="edit/:themeId" element={<EditTheme />} />
            <Route path="import" element={<ImportTheme />} />
          </Route> */}
          {/*end theme */}

          {/* Deals routes */}
          <Route path="/deals/*">
            <Route index element={<Deals />} />
            <Route path="add" element={<AddDeal />} />
            <Route path="edit/:dealId" element={<EditDeal />} />
            <Route path="trash" element={<DeletedDeals />} />
          </Route>
          <Route path="/translation/*">
            <Route index element={<AddTranslation />} />
            <Route path="add" element={<AddTranslation />} />
          </Route>
          {/* end sidebar */}
        </Route>
      </>
    </Routes>
  );
}

export default App;
