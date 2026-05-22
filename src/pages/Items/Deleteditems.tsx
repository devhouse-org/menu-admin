import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient, useInfiniteQuery } from "@tanstack/react-query";
import axios from "axios";
import { RotateCw, Trash2 } from "lucide-react";
import Popup from "@/components/Popup";
import Spinner from "@/components/Spinner";
import { highlightText } from "../../utils/utils";
import Pagination from "@/components/Pagination"; // Import the Pagination component
import axiosInstance from "@/axiosInstance";
import { Tooltip as ReactTooltip } from "react-tooltip";
import "react-tooltip/dist/react-tooltip.css"; // Importing the styles
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";

type itemReviewType = {
  id: string;
  name: string;
  description: string;
  price: number;
  categoryName: string;
  image: string;
};

const DeletedItems = () => {
  const [showDeletePopup, setShowDeletePopup] = useState(false); // Separate state for delete popup
  const [showRestorePopup, setShowRestorePopup] = useState(false); // Separate state for restore popup
  const [showRestoreManyPopup, setShowRestoreManyPopup] = useState(false);
  const [selectedItem, setSelectedItem] = useState<itemReviewType | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("");
  const [selectedRestaurant, setSelectedRestaurant] = useState("");
  const [selectedItems, setSelectedItems] = useState<string[]>([]);
  const [showDeleteManyPopup, setShowDeleteManyPopup] = useState(false); // State to manage delete many popup visibility
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const queryClient = useQueryClient();

  // Fetch deleted items based on current page, category, and restaurant filters
  const {
    data: itemsData,
    isLoading,
    isError,
    fetchNextPage: fetchNextPageItems,
    hasNextPage: hasNextPageItems,
    isFetchingNextPage: isFetchingNextPageItems,
    refetch,
  } = useInfiniteQuery({
    queryKey: ["findAll-deleted-items", selectedCategory, selectedRestaurant],
    queryFn: async ({ pageParam = 1 }) => {
      const params = new URLSearchParams();
      if (selectedCategory) params.append("categoryId", selectedCategory);
      if (selectedRestaurant) params.append("restaurantId", selectedRestaurant);
      params.append("page", pageParam.toString());
      
      const response = await axiosInstance.get(`/item/findAll-deleted`, { params });
      return response.data;
    },
    getNextPageParam: (lastPage) => {
      if (!lastPage || !lastPage.hasNextPage) return undefined;
      return lastPage.nextPage;
    },
    initialPageParam: 1,
  });

  // Fetch categories based on the selected restaurant
  const {
    data: categories,
    fetchNextPage: fetchNextPageCategories,
    hasNextPage: hasNextPageCategories,
    isFetchingNextPage: isFetchingNextPageCategories,
  } = useInfiniteQuery({
    queryKey: ["categories", selectedRestaurant],
    queryFn: async ({ pageParam = 1 }) => {
      if (!selectedRestaurant || selectedRestaurant === 'all') {
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
    enabled: !!selectedRestaurant && selectedRestaurant !== 'all',
  });

  // Fetch restaurants
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

  // Handle item restoration
  const restoreMutation = useMutation({
    mutationFn: async (id: string) => {
      await axiosInstance.put(`/item/restore/${id}`);
    },
    onSuccess: () => {
      refetch();
      queryClient.invalidateQueries({ queryKey: ["findAll-deleted"] });
      setShowRestorePopup(false); // Close the restore popup after success
    },
  });

  // Handle item restoration
  const restoreManyMutation = useMutation({
    mutationFn: async (selectedItemsIds: string[]) => {
      await axiosInstance.put(`/item/restore-many`, {
        data: selectedItemsIds,
      });
    },
    onSuccess: () => {
      refetch();
      queryClient.invalidateQueries({
        queryKey: ["restore-items"],
      });
      setShowRestoreManyPopup(false); // Close the restore popup after success
    },
  });

  // Handle bulk delete operation — standardized DeleteManyDto payload
  const deleteManyMutation = useMutation({
    mutationFn: (selectedItemsIds: string[]) => {
      return axiosInstance.delete(`/item/delete-many`, {
        data: { data: selectedItemsIds },
      });
    },
    onSuccess: () => {
      refetch();
      setShowDeleteManyPopup(false);
      setSelectedItems([]); // Clear selected items after successful deletion
      queryClient.invalidateQueries({
        queryKey: ["findAll-deleted-items"],
      });
    },
  });

  // Handle item final deletion
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      await axiosInstance.delete(`/item/${id}`);
    },
    onSuccess: () => {
      refetch();
      queryClient.invalidateQueries({ queryKey: ["findAll-deleted"] });
      setShowDeletePopup(false); // Close the delete popup after success
    },
  });

  // Handle restore and delete operations
  const handleRestoreClick = (item: itemReviewType) => {
    setSelectedItem(item);
    setShowRestorePopup(true); // Show restore popup
  };

  const handleDeleteClick = (item: itemReviewType) => {
    setSelectedItem(item);
    setShowDeletePopup(true); // Show delete popup
  };

  const confirmRestore = () => {
    if (selectedItem) {
      restoreMutation.mutate(selectedItem.id);
    }
  };

  const confirmRestoreMany = () => {
    if (selectedItems) {
      restoreManyMutation.mutate(selectedItems);
      setShowRestoreManyPopup(true);
    }
  };

  const confirmDeleteMany = () => {
    if (selectedItems) {
      deleteManyMutation.mutate(selectedItems);
    }
  };

  // Handle select all checkbox
  const handleSelectAll = () => {
    if (selectedItems.length === filteredData?.length) {
      setSelectedItems([]);
    } else {
      const allIds = filteredData?.map((item: any) => item.id) || [];
      setSelectedItems(allIds);
    }
  };

  // Handle individual row checkbox
  const handleSelectItem = (id: string) => {
    setSelectedItems((prevSelectedItems) =>
      prevSelectedItems.includes(id)
        ? prevSelectedItems.filter((itemId) => itemId !== id)
        : [...prevSelectedItems, id]
    );
  };

  const confirmDelete = () => {
    if (selectedItem) {
      deleteMutation.mutate(selectedItem.id);
    }
  };

  const filteredData = itemsData?.pages.flatMap(page => 
    page.items.filter((item: any) =>
      item.name.toLowerCase().includes(searchQuery.toLowerCase())
    )
  ) || [];

  const totalPages = Math.ceil(filteredData.length / itemsPerPage);
  const currentData = filteredData.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const handlePageChange = (newPage: number) => {
    setCurrentPage(newPage);
    setSelectedItems([]);
    
    // Calculate if we need to fetch more data
    const totalItemsNeeded = newPage * itemsPerPage;
    const currentTotalItems = itemsData?.pages.reduce(
      (total, page) => total + page.items.length,
      0
    ) || 0;

    if (totalItemsNeeded > currentTotalItems && hasNextPageItems) {
      fetchNextPageItems();
    }
  };

  const handleDeleteMany = () => {
    setShowDeleteManyPopup(true);
  };

  const handleRestoreMany = () => {
    setShowRestoreManyPopup(true);
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
      <ReactTooltip id="restore-many-tooltip" place="top-end" />
      <ReactTooltip id="restore-tooltip" place="top" />
      <ReactTooltip id="delete-tooltip" place="top" />

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
          <Select
            value={selectedCategory}
            onValueChange={(value) => setSelectedCategory(value)}
            disabled={!selectedRestaurant || selectedRestaurant === 'all'}
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
                  className="w-full text-center text-gray-600"
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

          {/* Restaurant Filter */}
          <Select
            value={selectedRestaurant}
            onValueChange={(value) => {
              setSelectedRestaurant(value);
              setSelectedCategory(''); // Reset category when restaurant changes
            }}
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
                  className="w-full text-center text-gray-600"
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
        <div className="flex gap-4 items-start">
          {selectedItems.length > 0 && (
            <button
              type="button"
              className="text-white bg-red-700 hover:bg-gray-900 focus:outline-none  font-medium rounded-lg  px-3 py-2.5"
              onClick={handleDeleteMany}
              data-tooltip-id="delete-many-tooltip"
              data-tooltip-content="Delete all selected"
            >
              Delete {selectedItems.length}
            </button>
          )}
          {selectedItems.length > 0 && (
            <button
              type="button"
              className="text-white bg-green-600 hover:bg-gray-900 focus:outline-none  font-medium rounded-lg  px-3 py-2.5"
              onClick={handleRestoreMany}
              data-tooltip-id="restore-many-tooltip"
              data-tooltip-content="Restore all selected"
            >
              Restore {selectedItems.length}
            </button>
          )}
        </div>
      </div>

      {/* Conditional rendering when no items are found */}
      {filteredData?.length === 0 ? (
        <div className="text-center py-10">
          <p className="text-gray-500">No deleted items found.</p>
        </div>
      ) : (
        <>
          {/* Items Table */}
          <table className="w-full text-sm text-left rtl:text-right text-gray-500">
            <thead className="text-xs text-gray-700 uppercase bg-gray-50">
              <tr>
                <th scope="col" className="px-6 py-3 w-4">
                  <input
                    type="checkbox"
                    checked={selectedItems.length === filteredData?.length}
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
                    <button
                      className="font-medium text-green-600"
                      onClick={() => handleRestoreClick(item)}
                      data-tooltip-id="restore-tooltip"
                      data-tooltip-content="Restore"
                    >
                      <RotateCw />
                    </button>
                    <button
                      className="font-medium text-red-600"
                      onClick={() => handleDeleteClick(item)}
                      data-tooltip-id="delete-tooltip"
                      data-tooltip-content="Delete"
                    >
                      <Trash2 />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* Pagination Component */}
          <div className="flex justify-center items-center mt-10">
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={handlePageChange}
            />
          </div>

          {/* Add Load More button for items */}
          {hasNextPageItems && (
            <div className="flex justify-center mt-4">
              <button
                onClick={() => fetchNextPageItems()}
                disabled={isFetchingNextPageItems}
                className="px-4 py-2 bg-gray-800 text-white rounded-md hover:bg-gray-700 disabled:bg-gray-500"
              >
                {isFetchingNextPageItems ? "Loading more..." : "Load More"}
              </button>
            </div>
          )}
        </>
      )}

      {/* Restore Confirmation Popup */}
      {showRestorePopup && (
        <Popup
          onClose={() => setShowRestorePopup(false)}
          onConfirm={confirmRestore}
          loading={restoreMutation.isPending}
          confirmText="Restore"
          loadingText="Restoring..."
          cancelText="Cancel"
        >
          <p>Are you sure you want to restore {selectedItem?.name}?</p>
        </Popup>
      )}

      {/* Restore Many Confirmation Popup */}
      {showRestoreManyPopup && (
        <Popup
          onClose={() => setShowRestoreManyPopup(false)}
          onConfirm={confirmRestoreMany}
          loading={restoreManyMutation.isPending}
          confirmText="Restore"
          loadingText="Restoring..."
          cancelText="Cancel"
        >
          <p>Are you sure you want to restore {selectedItems.length} items?</p>
        </Popup>
      )}

      {/* Delete Confirmation Popup */}
      {showDeletePopup && (
        <Popup
          onClose={() => setShowDeletePopup(false)}
          onConfirm={confirmDelete}
          loading={deleteMutation.isPending}
          confirmText="Delete"
          loadingText="Deleting..."
          cancelText="Cancel"
          confirmButtonVariant="red"
        >
          <p>Are you sure you want to delete {selectedItem?.name}?</p>
        </Popup>
      )}

      {/* Delete Many Popup */}
      {showDeleteManyPopup && (
        <Popup
          confirmText="Delete All"
          loadingText="Deleting..."
          cancelText="Cancel"
          onClose={() => setShowDeleteManyPopup(false)}
          onConfirm={confirmDeleteMany}
          loading={deleteManyMutation.isPending}
          confirmButtonVariant="red"
        >
          <p>
            Are you sure you want to delete {selectedItems.length} items?
            <span className="text-red-600"> *This action is irreversible.</span>
          </p>
        </Popup>
      )}
    </div>
  );
};

export default DeletedItems;
