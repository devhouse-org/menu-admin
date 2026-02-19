import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus, RotateCw, SquarePen, Trash2 } from "lucide-react";
import Popup from "@/components/Popup";
import { Link } from "react-router-dom";
import Spinner from "@/components/Spinner";
import { highlightText } from "@/utils/utils";
import axiosInstance from "@/axiosInstance";
import exportCSVFile from "json-to-csv-export";
import { DropdownMenuDemo } from "@/components/DropdownMenu";
import { Tooltip as ReactTooltip } from "react-tooltip";
import "react-tooltip/dist/react-tooltip.css";

type categoryReviewType = {
  id: string;
  name: string;
};

const flattenObject = (
  obj: Record<string, any>,
  parent = "",
  category: Record<string, any> = {}
): Record<string, any> => {
  for (let key in obj) {
    if (obj.hasOwnProperty(key)) {
      const propName = parent ? `${parent}.${key}` : key;
      if (typeof obj[key] === "object" && obj[key] !== null) {
        flattenObject(obj[key], propName, category);
      } else {
        category[propName] = obj[key];
      }
    }
  }
  return category;
};

const Category = () => {
  const [showPopup, setShowPopup] = useState(false);
  const [showDeleteManyPopup, setShowDeleteManyPopup] = useState(false);
  const [selectedCategory, setSelectedCategory] =
    useState<categoryReviewType | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedRestaurant, setSelectedRestaurant] = useState("");
  const [selectedItems, setSelectedItems] = useState<string[]>([]);

  const queryClient = useQueryClient();

  // Fetch restaurants
  const { data: restaurants } = useQuery({
    queryKey: ["restaurants"],
    queryFn: async () => {
      const res = await axiosInstance.get("/restaurant");
      return res.data;
    },
  });

  // Fetch ALL categories (no pagination)
  const {
    data: categoryData,
    isLoading,
    isError,
    refetch,
    isRefetching,
  } = useQuery({
    queryKey: ["categories", selectedRestaurant],
    queryFn: async () => {
      const params = new URLSearchParams();
      params.append("all", "true");
      if (selectedRestaurant) {
        params.append("restaurantId", selectedRestaurant);
      }
      const category = await axiosInstance.get(`/category`, { params });
      return category.data;
    },
    refetchOnWindowFocus: false,
  });

  const handleExport = () => {
    const flattenedData = categoryData.items.map((item: any) =>
      flattenObject(item)
    );
    const dataToConvert = {
      data: flattenedData,
      filename: "categories",
      delimiter: ",",
    };
    exportCSVFile(dataToConvert);
  };

  const handleReload = async () => {
    await queryClient.invalidateQueries({
      queryKey: ["categories"],
    });
    refetch();
  };

  const mutation = useMutation({
    mutationFn: async (id: string) => {
      await axiosInstance.delete(`/category/soft-delete/${id}`);
    },
    onSuccess: () => {
      refetch();
      queryClient.invalidateQueries({ queryKey: ["categories"] });
      setShowPopup(false);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (selectedItemsIds: string[]) => {
      return axiosInstance.put(`/category/soft-delete-many`, {
        data: selectedItemsIds,
      });
    },
    onSuccess: () => {
      refetch();
      setShowDeleteManyPopup(false);
    },
  });

  const handleDeleteClick = (item: any) => {
    setSelectedCategory(item);
    setShowPopup(true);
  };

  const confirmDeleteMany = () => {
    if (selectedItems.length > 0) {
      deleteMutation.mutate(selectedItems);
    }
  };

  const confirmDelete = () => {
    if (selectedCategory) {
      mutation.mutate(selectedCategory.id);
    }
  };

  // Filter by search query
  const allItems = categoryData?.items || [];
  const filteredData = searchQuery
    ? allItems.filter((item: any) =>
      item?.name?.toLowerCase().includes(searchQuery.toLowerCase())
    )
    : allItems;

  const handleSelectAll = () => {
    if (selectedItems.length === filteredData.length) {
      setSelectedItems([]);
    } else {
      const allIds = filteredData.map((item: any) => item.id);
      setSelectedItems(allIds);
    }
  };

  const handleSelectItem = (id: string) => {
    setSelectedItems((prev) =>
      prev.includes(id)
        ? prev.filter((itemId) => itemId !== id)
        : [...prev, id]
    );
  };

  const handleDeleteMany = () => {
    setShowDeleteManyPopup(true);
  };

  // Helper to get restaurant name by id
  const getRestaurantName = (restaurantId: string) => {
    const restaurant = restaurants?.items?.find(
      (r: any) => r.id === restaurantId
    );
    return restaurant?.name || "N/A";
  };

  if (isLoading) {
    return (
      <div className="w-full h-screen flex items-center justify-center">
        <Spinner />
      </div>
    );
  }

  if (isError) {
    return <div>Error</div>;
  }

  return (
    <div className="relative overflow-x-auto sm:rounded-lg w-full mx-6 md:mx-0 scrollbar-hide">
      <ReactTooltip id="delete-many-tooltip" place="top" />
      <ReactTooltip id="reload-tooltip" place="top" />
      <ReactTooltip id="add-category-tooltip" place="top" />
      <ReactTooltip id="trash-tooltip" place="top" />
      <ReactTooltip id="edit-category-tooltip" place="top" />
      <ReactTooltip id="delete-category-tooltip" place="top" />

      <div className="flex flex-wrap justify-between mb-4">
        <div className="flex flex-column sm:flex-row flex-wrap space-y-4 sm:space-y-0 items-center gap-4 pb-4">
          {/* Search Bar */}
          <div className="relative">
            <div className="absolute inset-y-0 left-0 rtl:inset-r-0 rtl:right-0 flex items-center ps-3 pointer-events-none">
              <svg
                className="w-5 h-5 text-gray-500"
                aria-hidden="true"
                fill="currentColor"
                viewBox="0 0 20 20"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  fillRule="evenodd"
                  d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z"
                  clipRule="evenodd"
                ></path>
              </svg>
            </div>
            <input
              type="text"
              id="table-search"
              className="block p-2 ps-10 text-sm text-gray-900 border border-gray-300 rounded-lg w-80 bg-gray-50 focus:ring-blue-500 focus:border-blue-500"
              placeholder="Search for categories"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          {/* Restaurant Filter */}
          <select
            value={selectedRestaurant}
            onChange={(e) => setSelectedRestaurant(e.target.value)}
            className="p-2 border border-gray-300 rounded-lg"
          >
            <option value="">All Restaurants</option>
            {restaurants?.items.map((restaurant: any) => (
              <option key={restaurant.id} value={restaurant.id}>
                {restaurant.name}
              </option>
            ))}
          </select>
        </div>

        <div className="gap-2 flex justify-center items-start">
          {selectedItems.length > 0 && (
            <button
              type="button"
              className="text-white w-10 h-10 xl:w-auto bg-red-600 hover:bg-red-700 focus:outline-none font-medium rounded-lg px-3 py-2.5"
              onClick={handleDeleteMany}
              data-tooltip-id="delete-many-tooltip"
              data-tooltip-content="Delete selected categories"
            >
              <div className="flex items-center flex-nowrap gap-1">
                <Trash2 size={16} />
                <span className="hidden xl:flex">Delete</span>
                <span className="hidden xl:flex">{selectedItems.length}</span>
              </div>
            </button>
          )}
          <button
            type="button"
            disabled={isRefetching}
            className="text-white w-10 h-10 xl:w-auto bg-gray-800 text-sm hover:bg-gray-900 font-medium rounded-lg py-2.5 px-3 disabled:animate-pulse disabled:bg-gray-600"
            onClick={handleReload}
            data-tooltip-id="reload-tooltip"
            data-tooltip-content="Reload categories"
          >
            <span className="hidden xl:flex items-center gap-1">
              <RotateCw
                size={16}
                className={isRefetching ? `animate-spin` : ""}
              />{" "}
              Reload
            </span>
            <span className="inline xl:hidden">
              <RotateCw
                size={16}
                className={isRefetching ? `animate-spin` : ""}
              />
            </span>
          </button>

          <Link to={"/categories/add"}>
            <button
              type="button"
              className="text-white w-10 h-10 xl:w-auto bg-gray-800 hover:bg-gray-900 font-medium rounded-lg py-2 xl:py-2.5 px-3 text-nowrap text-sm"
              data-tooltip-id="add-category-tooltip"
              data-tooltip-content="Add new category"
            >
              <span className="hidden xl:flex items-center gap-1">
                <Plus size={16} /> Add Category
              </span>
              <span className="inline xl:hidden">
                <Plus size={16} />
              </span>
            </button>
          </Link>

          <Link to={"/categories/trash"}>
            <button
              type="button"
              className="text-white w-10 h-10 xl:w-auto bg-gray-800 hover:bg-gray-900 font-medium rounded-lg py-2.5 px-3 text-sm"
              data-tooltip-id="trash-tooltip"
              data-tooltip-content="View trashed categories"
            >
              <span className="flex gap-1 items-center">
                <Trash2 size={16} /> <p className="hidden xl:inline">Trash</p>
              </span>
            </button>
          </Link>

          <DropdownMenuDemo
            handleExport={handleExport}
            link="/categories/import"
          ></DropdownMenuDemo>
        </div>
      </div>

      {filteredData.length === 0 ? (
        <div className="text-center py-10">
          <p className="text-gray-500">No categories found.</p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left rtl:text-right text-gray-500">
            <thead className="text-xs text-gray-700 uppercase bg-gray-50">
              <tr>
                <th scope="col" className="px-6 py-3 w-4">
                  <input
                    type="checkbox"
                    checked={
                      selectedItems.length === filteredData.length &&
                      filteredData.length > 0
                    }
                    onChange={handleSelectAll}
                  />
                </th>
                <th scope="col" className="px-6 py-3 w-4">
                  #
                </th>
                <th scope="col" className="px-6 py-3 w-4">
                  Name
                </th>
                <th scope="col" className="px-6 py-3 w-4">
                  Icon
                </th>
                <th scope="col" className="px-6 py-3">
                  Items No.
                </th>
                <th scope="col" className="px-6 py-3">
                  Order
                </th>
                <th scope="col" className="px-6 py-3">
                  Restaurant
                </th>
                <th scope="col" className="px-6 py-3"></th>
              </tr>
            </thead>
            <tbody>
              {filteredData.map((item: any, index: number) => (
                <tr
                  key={item.id}
                  className="bg-white border-b hover:bg-gray-50"
                >
                  <td className="px-6 py-4">
                    <input
                      type="checkbox"
                      checked={selectedItems.includes(item.id)}
                      onChange={() => handleSelectItem(item.id)}
                    />
                  </td>
                  <td className="px-6 py-4">{index + 1}</td>
                  <td className="px-6 py-4 font-medium text-gray-900 whitespace-nowrap">
                    {highlightText(item?.name || "", searchQuery)}
                  </td>
                  <td className="px-6 py-4 font-medium text-gray-900 whitespace-nowrap">
                    {item?.icon || "—"}
                  </td>
                  <td className="px-6 py-4">{item?._count?.items ?? 0}</td>
                  <td className="px-6 py-4">{item?.orderNumber ?? "—"}</td>
                  <td className="px-6 py-4">
                    {getRestaurantName(item?.restaurantId)}
                  </td>
                  <td className="px-6 py-4 flex gap-x-4">
                    <Link
                      to={`/categories/edit/${item.id}`}
                      state={item}
                      className="font-medium text-blue-600"
                      data-tooltip-id="edit-category-tooltip"
                      data-tooltip-content="Edit category"
                    >
                      <SquarePen />
                    </Link>
                    <button
                      className="font-medium text-red-600"
                      onClick={() => handleDeleteClick(item)}
                      data-tooltip-id="delete-category-tooltip"
                      data-tooltip-content="Delete category"
                    >
                      <Trash2 />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {showDeleteManyPopup && (
        <Popup
          onClose={() => setShowDeleteManyPopup(false)}
          onConfirm={confirmDeleteMany}
          loading={deleteMutation.isPending}
          confirmText="Delete"
          loadingText="Deleting..."
          cancelText="Cancel"
          confirmButtonVariant="red"
        >
          <p>
            Are you sure you want to delete{" "}
            {selectedItems && selectedItems.length + " category/s"}?
          </p>
        </Popup>
      )}

      {showPopup && (
        <Popup
          onClose={() => setShowPopup(false)}
          onConfirm={confirmDelete}
          loading={mutation.isPending}
          confirmText="Delete"
          loadingText="Deleting..."
          cancelText="Cancel"
          confirmButtonVariant="red"
        >
          <p>Are you sure you want to delete {selectedCategory?.name}?</p>
        </Popup>
      )}
    </div>
  );
};

export default Category;
