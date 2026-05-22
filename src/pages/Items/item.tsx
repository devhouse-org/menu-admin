import { useState, useEffect } from "react";
import {
  useInfiniteQuery,
  useMutation,
  useQueryClient,
} from "@tanstack/react-query";
import { Plus, RotateCw, SquarePen, Trash2 } from "lucide-react";
import Popup from "@/components/Popup";
import { Link, useSearchParams } from "react-router-dom";
import Spinner from "@/components/Spinner";
import { highlightText } from "../../utils/utils";
import Pagination from "@/components/Pagination"; // Import the Pagination component
import exportCSVFile from "json-to-csv-export";
import axiosInstance from "@/axiosInstance";
import { Tooltip as ReactTooltip } from "react-tooltip";
import "react-tooltip/dist/react-tooltip.css"; // Importing the styles

import { DropdownMenuDemo } from "@/components/DropdownMenu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";

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
  const [searchParams, setSearchParams] = useSearchParams();
  const [showPopup, setShowPopup] = useState(false);
  const [showDeleteManyPopup, setShowDeleteManyPopup] = useState(false); // State to manage popup visibility
  const [selectedItem, setSelectedItem] = useState<itemReviewType | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState(
    searchParams.get("category") || ""
  );
  const [selectedRestaurant, setSelectedRestaurant] = useState(
    searchParams.get("restaurant") || ""
  );
  const [selectedItems, setSelectedItems] = useState<string[]>([]); // State to manage selected items for checkbox selection
  const [currentPage, setCurrentPage] = useState(
    parseInt(searchParams.get("page") || "1")
  );
  const [headers, setHeaders] = useState<string[]>();
  const itemsPerPage = 10;
  const queryParams = new URLSearchParams();

  const queryClient = useQueryClient();

  // Update items query to use infinite query
  const {
    data: itemsData,
    isLoading,
    isError,
    fetchNextPage: fetchNextPageItems,
    hasNextPage: hasNextPageItems,
    isFetchingNextPage: isFetchingNextPageItems,
    refetch,
    isRefetching,
  } = useInfiniteQuery({
    // Include `searchQuery` in the key so the cache refetches when the
    // user types a new term, and forward it to the backend so the
    // search covers the entire dataset (not just the loaded pages).
    queryKey: ["items", selectedCategory, selectedRestaurant, searchQuery],
    queryFn: async ({ pageParam = 1 }) => {
      const params = new URLSearchParams();
      if (selectedRestaurant && selectedRestaurant !== "all") {
        params.append("restaurantId", selectedRestaurant);
      }
      if (selectedCategory && selectedCategory !== "all") {
        params.append("categoryId", selectedCategory);
      }
      if (searchQuery.trim()) {
        params.append("search", searchQuery.trim());
      }
      params.append("page", pageParam.toString());

      const response = await axiosInstance.get(`/item`, { params });
      return response.data;
    },
    getNextPageParam: (lastPage) => {
      if (!lastPage || !lastPage.hasNextPage) return undefined;
      return lastPage.nextPage;
    },
    initialPageParam: 1,
  });

  // Update restaurants query to use infinite query
  const {
    data: restaurants,
    fetchNextPage: fetchNextPageRestaurants,
    hasNextPage: hasNextPageRestaurants,
    isFetchingNextPage: isFetchingNextPageRestaurants,
  } = useInfiniteQuery({
    queryKey: ["restaurants"],
    queryFn: async ({ pageParam = 1 }) => {
      const response = await axiosInstance.get(`/restaurant?page=${pageParam}`);
      return response.data;
    },
    getNextPageParam: (lastPage) => {
      if (!lastPage || !lastPage.hasNextPage) return undefined;
      return lastPage.nextPage;
    },
    initialPageParam: 1,
  });

  // Update categories query to use infinite query
  const {
    data: categories,
    fetchNextPage: fetchNextPageCategories,
    hasNextPage: hasNextPageCategories,
    isFetchingNextPage: isFetchingNextPageCategories,
  } = useInfiniteQuery({
    queryKey: ["categories", selectedRestaurant],
    queryFn: async ({ pageParam = 1 }) => {
      if (!selectedRestaurant || selectedRestaurant === "all") {
        return { items: [], hasNextPage: false, nextPage: undefined };
      }
      const response = await axiosInstance.get(
        `/category?restaurantId=${selectedRestaurant}&page=${pageParam}`
      );
      return response.data;
    },
    getNextPageParam: (lastPage) => {
      if (!lastPage || !lastPage.hasNextPage) return undefined;
      return lastPage.nextPage;
    },
    initialPageParam: 1,
    enabled: !!selectedRestaurant && selectedRestaurant !== "all",
  });

  const handleExport = () => {
    if (!itemsData) return;
    const flattenedData = itemsData.pages.flatMap((page) =>
      page.items.map((item: any) => flattenObject(item))
    );
    const dataExcludedCategory = itemsData.pages.flatMap((page) =>
      page.items.map((items: any) => {
        const { category, ...rest } = items;
        return rest;
      })
    );
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

  // Server now handles filtering by `search` query — just flatten pages.
  // We still need the locally-flattened list so the client-side
  // pagination control below works against the loaded pages.
  const filteredData =
    itemsData?.pages.flatMap((page) => page.items) || [];

  // Update pagination logic
  const currentData = filteredData.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );
  const totalPages = Math.ceil(filteredData.length / itemsPerPage);

  // Reset the current page to 1 when filters change
  useEffect(() => {
    setCurrentPage(1);
    queryParams.set("page", "1");
    if (selectedRestaurant) {
      queryParams.set("restaurant", selectedRestaurant);
    }
    if (selectedCategory) {
      queryParams.set("category", selectedCategory);
    }
    setSearchParams(queryParams);
  }, [selectedCategory, selectedRestaurant, searchQuery]);

  const handlePageChange = (newPage: number) => {
    setCurrentPage(newPage);
    setSelectedItems([]);
    
    queryParams.set("page", newPage.toString());
    if (selectedRestaurant) {
      queryParams.set("restaurant", selectedRestaurant);
    }
    if (selectedCategory) {
      queryParams.set("category", selectedCategory);
    }
    setSearchParams(queryParams);
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

  const handleRestaurantChange = (value: string) => {
    setSelectedRestaurant(value);
    setSelectedCategory(""); // Reset category when restaurant changes
    queryParams.set("category", "");
    queryParams.set("restaurant", value);
    queryParams.set("page", "1"); // Reset to page 1 when restaurant changes
    setSearchParams(queryParams);
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

          {/* Updated Category Filter */}
          <Select
            value={selectedCategory}
            onValueChange={(value) => {
              setSelectedCategory(value);
              queryParams.set("category", value);
              queryParams.set("restaurant", selectedRestaurant);

              setSearchParams(queryParams);
            }}
            disabled={!selectedRestaurant || selectedRestaurant === "all"}
          >
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder="All Categories" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Categories</SelectItem>
              {categories?.pages.map((page) =>
                page.items.map((category: any) => (
                  <SelectItem key={category.id} value={category.id}>
                    {category.name}
                  </SelectItem>
                ))
              )}
              {hasNextPageCategories && (
                <Button
                  className="w-full text-center text-gray-800 bg-gray-200 hover:bg-gray-200"
                  onClick={(e) => {
                    e.preventDefault();
                    fetchNextPageCategories();
                  }}
                  disabled={isFetchingNextPageCategories}
                >
                  {isFetchingNextPageCategories ? "Loading..." : "Load More"}
                </Button>
              )}
            </SelectContent>
          </Select>

          {/* Updated Restaurant Filter */}
          <Select
            value={selectedRestaurant}
            onValueChange={handleRestaurantChange}
          >
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder="All Restaurants" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Restaurants</SelectItem>
              {restaurants?.pages.map((page) =>
                page.items.map((restaurant: any) => (
                  <SelectItem key={restaurant.id} value={restaurant.id}>
                    {restaurant.name}
                  </SelectItem>
                ))
              )}
              {hasNextPageRestaurants && (
                <Button
                  className="w-full text-center text-gray-800 bg-gray-200 hover:bg-gray-200"
                  onClick={(e) => {
                    e.preventDefault();
                    fetchNextPageRestaurants();
                  }}
                  disabled={isFetchingNextPageRestaurants}
                >
                  {isFetchingNextPageRestaurants ? "Loading..." : "Load More"}
                </Button>
              )}
            </SelectContent>
          </Select>
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
      {currentData.length === 0 ? (
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

          {/* Add Load More button for items */}
          {hasNextPageItems && (
            <div className="flex justify-center mt-4">
              <Button
                onClick={() => fetchNextPageItems()}
                disabled={isFetchingNextPageItems}
                className="bg-gray-800 text-white hover:bg-gray-700"
              >
                {isFetchingNextPageItems
                  ? "Loading more..."
                  : "Load More Items"}
              </Button>
            </div>
          )}

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
