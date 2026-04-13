import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import axios from "axios";
import { Plus, RotateCw, SquarePen, Trash2 } from "lucide-react";
import Popup from "@/components/Popup";
import { Link } from "react-router-dom";
import Spinner from "@/components/Spinner";
import { highlightText } from "../../utils/utils";
import Pagination from "@/components/Pagination"; // Import the Pagination component
import exportCSVFile from "json-to-csv-export";
import axiosInstance from "@/axiosInstance";
import { Tooltip as ReactTooltip } from "react-tooltip";
import "react-tooltip/dist/react-tooltip.css"; // Importing the styles

import { DropdownMenuDemo } from "@/components/DropdownMenu";

type itemReviewType = {
  id: string;
  name: string;
  description: string;
  price: number;
  categoryName: string;
  image: string;
};

interface DataItem {
  categoryId: string;
  createdAt: string;
  deleted: boolean;
  description: string;
  id: string;
  image: string | null;
  name: string;
  price: number;
  updatedAt: string;
}

// Utility function to flatten the JSON object
const flattenObject = (
  obj: Record<string, any>,
  parent = "",
  res: Record<string, any> = {}
): Record<string, any> => {
  for (let key in obj) {
    if (obj.hasOwnProperty(key)) {
      const propName = parent ? `${parent}.${key}` : key;
      if (typeof obj[key] === "object" && obj[key] !== null) {
        flattenObject(obj[key], propName, res);
      } else {
        res[propName] = obj[key];
      }
    }
  }
  return res;
};

// Extract headers from the data
const extractHeaders = (data: DataItem[]): string[] => {
  // const flattenedData = data.map((item) => flattenObject(item));
  const headers = Array.from(new Set(data.flatMap(Object.keys)));
  return headers;
};

const Item = () => {
  const [showPopup, setShowPopup] = useState(false);
  const [showDeleteManyPopup, setShowDeleteManyPopup] = useState(false); // State to manage popup visibility
  const [selectedItem, setSelectedItem] = useState<itemReviewType | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState("");
  
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearchQuery(searchQuery);
    }, 500);
    return () => {
      clearTimeout(handler);
    };
  }, [searchQuery]);

  const [selectedCategory, setSelectedCategory] = useState("");
  const [selectedRestaurant, setSelectedRestaurant] = useState("");
  const [selectedItems, setSelectedItems] = useState<string[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [headers, setHeaders] = useState<string[]>();
  const itemsPerPage = 10;

  const queryClient = useQueryClient();

  // Fetch items based on current page, category, and restaurant filters
  const {
    data: itemsData,
    isLoading,
    isError,
    refetch,
    isRefetching,
  } = useQuery({
    queryKey: ["items", selectedCategory, selectedRestaurant, debouncedSearchQuery, currentPage],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (selectedCategory) params.append("categoryId", selectedCategory);
      if (selectedRestaurant) params.append("restaurantId", selectedRestaurant);
      if (debouncedSearchQuery) params.append("search", debouncedSearchQuery);
      params.append("page", String(currentPage));

      const item = await axiosInstance.get(`/item`, { params });
      return item.data;
    },
    refetchOnWindowFocus: false,
  });
  
  const handleExport = () => {
    const flattenedData = itemsData.items.map((item: any) =>
      flattenObject(item)
    );
    const dataExcludedCategory = itemsData.items.map((items: any) => {
      const { category, ...rest } = items;
      return rest;
    });
    const dataToConvert = {
      data: dataExcludedCategory,
      filename: "items",
      delimiter: ",",
      headers,
    };

    exportCSVFile(dataToConvert);
  };

  const handleReload = async () => {
    await queryClient.invalidateQueries({
      queryKey: ["items", selectedCategory, selectedRestaurant],
    });
    refetch(); // Optionally trigger refetch after invalidation
  };
  // Fetch categories based on the selected restaurant
  const { data: categories } = useQuery({
    queryKey: ["categories", selectedRestaurant],
    queryFn: async () => {
      if (!selectedRestaurant) return []; // Return empty array if no restaurant is selected
      const res = await axiosInstance.get(
        `/category?restaurantId=${selectedRestaurant}`
      );
      return res.data;
    },
    enabled: !!selectedRestaurant, // Only fetch categories when a restaurant is selected
  });

  // Fetch restaurants
  const { data: restaurants } = useQuery({
    queryKey: ["restaurants"],
    queryFn: async () => {
      const res = await axiosInstance.get("/restaurant");
      return res.data;
    },
  });

  // Mutation to delete a single item
  const mutation = useMutation({
    mutationFn: async (id: string) => {
      await axiosInstance.delete(`/item/soft-delete/${id}`);
    },
    onSuccess: () => {
      refetch();
      queryClient.invalidateQueries({ queryKey: ["items"] });
      setShowPopup(false);
    },
  });

  // Mutation to delete multiple items
  const deleteMutation = useMutation({
    mutationFn: (selectedItemsIds: string[]) => {
      return axiosInstance.put(`/item/soft-delete-many`, {
        data: selectedItemsIds,
      });
    },
    onSuccess: () => {
      refetch();
      queryClient.invalidateQueries({ queryKey: ["items"] });
      setShowDeleteManyPopup(false);
      return "Items deleted successfully";
    },
  });

  // Server-side data — use directly from API response
  const currentData = itemsData?.items ?? [];
  const totalPages = Math.ceil((itemsData?.totalItems ?? 0) / itemsPerPage);

  // Reset the current page to 1 when filters or search change
  useEffect(() => {
    setCurrentPage(1);
  }, [selectedCategory, selectedRestaurant, debouncedSearchQuery]);

  const handlePageChange = (newPage: number) => {
    setCurrentPage(newPage);
    setSelectedItems([]);
  };

  const handleSelectAll = () => {
    if (selectedItems.length === currentData.length) {
      setSelectedItems([]);
    } else {
      const allIds = currentData.map((item: any) => item.id);
      setSelectedItems(allIds);
    }
  };

  const handleSelectItem = (id: string) => {
    setSelectedItems((prevSelectedItems) =>
      prevSelectedItems.includes(id)
        ? prevSelectedItems.filter((itemId) => itemId !== id)
        : [...prevSelectedItems, id]
    );
  };

  const handleDeleteClick = (item: itemReviewType) => {
    setSelectedItem(item);
    setShowPopup(true);
  };

  const confirmDelete = () => {
    if (selectedItem) {
      mutation.mutate(selectedItem.id);
    }
  };

  const confirmDeleteMany = () => {
    if (selectedItems.length > 0) {
      deleteMutation.mutate(selectedItems);
    }
  };

  const handleDeleteMany = () => {
    setShowDeleteManyPopup(true);
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
  // console.log(currentData)
  return (
    <div className="relative overflow-x-auto sm:rounded-lg w-full mx-6 md:mx-0 scrollbar-hide">
      {/* Tooltip initialization */}
      <ReactTooltip id="delete-many-tooltip" place="top" />
      <ReactTooltip id="reload-tooltip" place="top" />
      <ReactTooltip id="add-item-tooltip" place="top" />
      <ReactTooltip id="trash-tooltip" place="top" />
      <ReactTooltip id="edit-item-tooltip" place="top" />
      <ReactTooltip id="delete-item-tooltip" place="top" />

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
              placeholder="Search for items"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          {/* Category Filter */}
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="p-2 border border-gray-300 rounded-lg disabled:bg-gray-200"
            disabled={!selectedRestaurant} // Disable category filter until a restaurant is selected
          >
            <option value="">All Categories</option>
            {categories?.items?.map((category: any) => (
              <option key={category.id} value={category.id}>
                {category.name}
              </option>
            ))}
          </select>

          {/* Restaurant Filter */}
          <select
            value={selectedRestaurant}
            onChange={(e) => {
              setSelectedRestaurant(e.target.value);
              setSelectedCategory(""); // Reset the category when a new restaurant is selected
            }}
            className="p-2 border border-gray-300 rounded-lg"
          >
            <option value="">All Restaurants</option>
            {restaurants?.items?.map((restaurant: any) => (
              <option key={restaurant.id} value={restaurant.id}>
                {restaurant.name}
              </option>
            ))}
          </select>
        </div>

        <div className="gap-2 flex items-start justify-center">
          {selectedItems.length > 0 && (
            <button
              type="button"
              className="text-white w-10 h-10 xl:w-auto bg-red-600 hover:bg-red-700 focus:outline-none  font-medium rounded-lg  px-3 py-2.5"
              onClick={handleDeleteMany}
              data-tooltip-id="delete-many-tooltip"
              data-tooltip-content="Delete selected items"
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
            data-tooltip-content="Reload items"
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

          <Link to="/items/add">
            <button
              type="button"
              className="text-white w-10 h-10 xl:w-auto bg-gray-800 hover:bg-gray-900 font-medium rounded-lg py-2 xl:py-2.5 px-3 text-nowrap text-sm"
              data-tooltip-id="add-item-tooltip"
              data-tooltip-content="Add new item"
            >
              <span className="hidden xl:flex items-center gap-1">
                <Plus size={16} /> Add Item
              </span>
              <span className="inline xl:hidden">
                <Plus size={16} />
              </span>
            </button>
          </Link>

          <Link to="/items/trash">
            <button
              type="button"
              className="text-white w-10 h-10 xl:w-auto bg-gray-800 text-sm hover:bg-gray-900 font-medium rounded-lg py-2.5 px-3"
              data-tooltip-id="trash-tooltip"
              data-tooltip-content="View trashed items"
            >
              <span className="flex gap-1 items-center">
                <Trash2 size={16} /> <p className="hidden xl:inline">Trash</p>
              </span>
            </button>
          </Link>

          <DropdownMenuDemo handleExport={handleExport} link="/items/import" />
        </div>
      </div>

      {/* Conditional rendering when there are no items */}
      {currentData && currentData.length === 0 ? (
        <div className="w-full text-center py-10">
          <p className="text-gray-500">No items found.</p>
        </div>
      ) : (
        <>
          {/* Items Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left rtl:text-right text-gray-500">
              <thead className="text-xs text-gray-700 uppercase bg-gray-50">
                <tr>
                  <th scope="col" className="px-6 py-3 w-4">
                    <input
                      type="checkbox"
                      checked={selectedItems.length === currentData?.length}
                      onChange={handleSelectAll}
                    />
                  </th>
                  <th scope="col" className="px-6 py-3">
                    #
                  </th>
                  <th scope="col" className="px-6 py-3">
                    Name
                  </th>
                  <th scope="col" className="px-6 py-3">
                    Description
                  </th>
                  <th scope="col" className="px-6 py-3">
                    Price
                  </th>
                  <th scope="col" className="px-6 py-3"></th>
                </tr>
              </thead>
              <tbody>
                {currentData?.map((item: any, index: number) => (
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
                    <td className="px-6 py-4">
                      {(currentPage - 1) * itemsPerPage + index + 1}
                    </td>
                    <td className="px-6 py-4 font-medium text-gray-900 whitespace-nowrap">
                      {highlightText(item?.name, searchQuery)}
                    </td>
                    <td className="px-6 py-4">{item?.description}</td>
                    <td className="px-6 py-4">{item?.price}</td>
                    <td className="px-6 py-4 flex gap-x-4">
                      <Link
                        to={`/items/edit/${item.id}`}
                        state={item}
                        data-tooltip-id="edit-item-tooltip"
                        data-tooltip-content="Edit item"
                      >
                        <SquarePen className="text-blue-600" />
                      </Link>
                      <button
                        className="font-medium text-red-600"
                        onClick={() => handleDeleteClick(item)}
                        data-tooltip-id="delete-item-tooltip"
                        data-tooltip-content="Delete item"
                      >
                        <Trash2 />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination Component */}
          {totalPages > 1 && (
            <div className="flex justify-center items-center mt-10">
              <Pagination
                currentPage={currentPage}
                totalPages={totalPages}
                onPageChange={handlePageChange}
              />
            </div>
          )}
        </>
      )}

      {/* Delete Confirmation Popup for Multiple Items */}
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
            {selectedItems && selectedItems.length + " item/s"}?
          </p>
        </Popup>
      )}

      {/* Delete Confirmation Popup for Single Item */}
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
          <p>Are you sure you want to delete {selectedItem?.name}?</p>
        </Popup>
      )}
    </div>
  );
};

export default Item;
