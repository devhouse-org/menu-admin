import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient, useInfiniteQuery } from "@tanstack/react-query";
import { RotateCw, Trash2 } from "lucide-react";
import Popup from "@/components/Popup";
import Spinner from "@/components/Spinner";
import { highlightText } from "../../utils/utils";
import Pagination from "@/components/Pagination";
import axiosInstance from "@/axiosInstance";
import { Tooltip as ReactTooltip } from "react-tooltip";
import "react-tooltip/dist/react-tooltip.css";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";

type DealType = {
  id: string;
  title: string;
  description: string;
  discount: string;
  restaurantId: string;
  published: boolean;
  expiresAt: string;
};

const DeletedDeals = () => {
  const [showDeletePopup, setShowDeletePopup] = useState(false);
  const [showRestorePopup, setShowRestorePopup] = useState(false);
  const [showRestoreManyPopup, setShowRestoreManyPopup] = useState(false);
  const [selectedDeal, setSelectedDeal] = useState<DealType | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedRestaurant, setSelectedRestaurant] = useState("");
  const [selectedDeals, setSelectedDeals] = useState<string[]>([]);
  const [showDeleteManyPopup, setShowDeleteManyPopup] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const queryClient = useQueryClient();

  const {
    data: dealsData,
    isPending,
    isError,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    refetch,
  } = useInfiniteQuery({
    queryKey: ["findAll-deleted-deals", selectedRestaurant],
    initialPageParam: 1,
    queryFn: async ({ pageParam = 1 }) => {
      const params = new URLSearchParams();
      params.append("page", pageParam.toString());
      if (selectedRestaurant && selectedRestaurant !== 'all') {
        params.append("restaurantId", selectedRestaurant);
      }
      const response = await axiosInstance.get(`/deal/findAll-deleted`, { params });
      return response.data;
    },
    getNextPageParam: (lastPage, pages) => {
      const totalPages = Math.ceil(lastPage.totalItems / itemsPerPage);
      const nextPage = pages.length + 1;
      return nextPage <= totalPages ? nextPage : undefined;
    },
    refetchOnWindowFocus: false,
  });

  const {
    data: restaurantsData,
    fetchNextPage: fetchNextRestaurants,
    hasNextPage: hasNextRestaurants,
    isFetchingNextPage: isFetchingNextRestaurants
  } = useInfiniteQuery({
    queryKey: ["restaurants"],
    initialPageParam: 1,
    queryFn: async ({ pageParam = 1 }) => {
      const params = new URLSearchParams();
      params.append("page", pageParam.toString());
      const res = await axiosInstance.get("/restaurant", { params });
      return res.data;
    },
    getNextPageParam: (lastPage) => {
      if (!lastPage || !lastPage.hasNextPage) return undefined;
      return lastPage.nextPage;
    },
  });

  const restaurants = restaurantsData?.pages.flatMap(page => page.items) ?? [];

  const restoreMutation = useMutation({
    mutationFn: async (id: string) => {
      await axiosInstance.put(`/deal/restore/${id}`);
    },
    onSuccess: () => {
      refetch();
      queryClient.invalidateQueries({ queryKey: ["findAll-deleted-deals"] });
      setShowRestorePopup(false);
    },
  });

  const restoreManyMutation = useMutation({
    mutationFn: async (selectedDealsIds: string[]) => {
      await axiosInstance.put(`/deal/restore-many`, {
        data: selectedDealsIds,
      });
    },
    onSuccess: () => {
      refetch();
      queryClient.invalidateQueries({ queryKey: ["restore-deals"] });
      setShowRestoreManyPopup(false);
    },
  });

  const deleteManyMutation = useMutation({
    mutationFn: (selectedDealsIds: string[]) => {
      // Backend expects { data: string[] } (standardized DeleteManyDto).
      return axiosInstance.delete(`/deal/delete-many`, {
        data: { data: selectedDealsIds },
      });
    },
    onSuccess: () => {
      refetch();
      setShowDeleteManyPopup(false);
      setSelectedDeals([]);
      queryClient.invalidateQueries({ queryKey: ["findAll-deleted-deals"] });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      await axiosInstance.delete(`/deal/${id}`);
    },
    onSuccess: () => {
      refetch();
      queryClient.invalidateQueries({ queryKey: ["findAll-deleted-deals"] });
      setShowDeletePopup(false);
    },
  });

  const handleRestoreClick = (deal: DealType) => {
    setSelectedDeal(deal);
    setShowRestorePopup(true);
  };

  const handleDeleteClick = (deal: DealType) => {
    setSelectedDeal(deal);
    setShowDeletePopup(true);
  };

  const confirmRestore = () => {
    if (selectedDeal) {
      restoreMutation.mutate(selectedDeal.id);
    }
  };

  const confirmRestoreMany = () => {
    if (selectedDeals.length > 0) {
      restoreManyMutation.mutate(selectedDeals);
    }
  };

  const confirmDeleteMany = () => {
    if (selectedDeals.length > 0) {
      deleteManyMutation.mutate(selectedDeals);
    }
  };

  const handleSelectAll = () => {
    if (selectedDeals.length === filteredData?.length) {
      setSelectedDeals([]);
    } else {
      const allIds = filteredData?.map((deal: DealType) => deal.id) || [];
      setSelectedDeals(allIds);
    }
  };

  const handleSelectDeal = (id: string) => {
    setSelectedDeals((prevSelectedDeals) =>
      prevSelectedDeals.includes(id)
        ? prevSelectedDeals.filter((dealId) => dealId !== id)
        : [...prevSelectedDeals, id]
    );
  };

  const confirmDelete = () => {
    if (selectedDeal) {
      deleteMutation.mutate(selectedDeal.id);
    }
  };

  const deals = dealsData?.pages.flatMap(page => page.items) ?? [];

  const filteredData = deals.filter((deal: DealType) =>
    deal.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const totalPages = Math.ceil(dealsData?.totalItems / itemsPerPage);

  const handlePageChange = (newPage: number) => {
    setCurrentPage(newPage);
    setSelectedDeals([]);
    
    const totalItemsNeeded = newPage * itemsPerPage;
    const currentTotalItems = dealsData?.pages.reduce(
      (total, page) => total + page.items.length,
      0
    ) || 0;

    if (totalItemsNeeded > currentTotalItems && hasNextPage) {
      fetchNextPage();
    }
  };

  const handleDeleteMany = () => {
    setShowDeleteManyPopup(true);
  };

  const handleRestoreMany = () => {
    setShowRestoreManyPopup(true);
  };

  const handleRestaurantChange = (value: string) => {
    setSelectedRestaurant(value === "all" ? "" : value);
    setCurrentPage(1);
    setSelectedDeals([]);
  };

  useEffect(() => {
    setCurrentPage(1);
    setSelectedDeals([]);
    queryClient.resetQueries({ 
      queryKey: ["findAll-deleted-deals", selectedRestaurant]
    });
  }, [selectedRestaurant, searchQuery, queryClient]);

  if (isPending) {
    return (
      <div className="w-full h-screen flex items-center justify-center">
        <Spinner />
      </div>
    );
  }

  if (isError) {
    return <div>Error loading deleted deals</div>;
  }

  return (
    <div className="relative overflow-x-auto sm:rounded-lg w-full mx-6 md:mx-0 scrollbar-hide">
      <ReactTooltip id="delete-many-tooltip" place="top" />
      <ReactTooltip id="restore-many-tooltip" place="top-end" />
      <ReactTooltip id="restore-tooltip" place="top" />
      <ReactTooltip id="delete-tooltip" place="top" />

      <div className="flex flex-wrap justify-between mb-4">
        <div className="flex flex-column sm:flex-row flex-wrap space-y-4 sm:space-y-0 items-center gap-4 pb-4">
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
              placeholder="Search for deals"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          <div className="flex flex-col gap-2">
            <Select
              value={selectedRestaurant}
              onValueChange={handleRestaurantChange}
            >
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="All Restaurants" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Restaurants</SelectItem>
                {restaurants?.map((restaurant: any) => (
                  <SelectItem key={restaurant.id} value={restaurant.id}>
                    {restaurant.name}
                  </SelectItem>
                ))}
                {hasNextRestaurants && (
                  <Button
                    className="w-full text-center text-gray-600"
                    onClick={(e) => {
                      e.preventDefault();
                      fetchNextRestaurants();
                    }}
                    disabled={isFetchingNextRestaurants}
                  >
                    {isFetchingNextRestaurants ? "Loading..." : "Load More"}
                  </Button>
                )}
              </SelectContent>
            </Select>
          </div>
        </div>
        <div className="flex gap-4 items-start">
          {selectedDeals.length > 0 && (
            <button
              type="button"
              className="text-white bg-red-700 hover:bg-gray-900 focus:outline-none  font-medium rounded-lg  px-3 py-2.5"
              onClick={handleDeleteMany}
              data-tooltip-id="delete-many-tooltip"
              data-tooltip-content="Delete all selected"
            >
              Delete {selectedDeals.length}
            </button>
          )}
          {selectedDeals.length > 0 && (
            <button
              type="button"
              className="text-white bg-green-600 hover:bg-gray-900 focus:outline-none  font-medium rounded-lg  px-3 py-2.5"
              onClick={handleRestoreMany}
              data-tooltip-id="restore-many-tooltip"
              data-tooltip-content="Restore all selected"
            >
              Restore {selectedDeals.length}
            </button>
          )}
        </div>
      </div>

      {filteredData?.length === 0 ? (
        <div className="text-center py-10">
          <p className="text-gray-500">No deleted deals found.</p>
        </div>
      ) : (
        <>
          <table className="w-full text-sm text-left rtl:text-right text-gray-500">
            <thead className="text-xs text-gray-700 uppercase bg-gray-50">
              <tr>
                <th scope="col" className="px-6 py-3 w-4">
                  <input
                    type="checkbox"
                    checked={selectedDeals.length === filteredData?.length}
                    onChange={handleSelectAll}
                  />
                </th>
                <th scope="col" className="px-6 py-3">#</th>
                <th scope="col" className="px-6 py-3">Title</th>
                <th scope="col" className="px-6 py-3">Description</th>
                <th scope="col" className="px-6 py-3">Discount</th>
                <th scope="col" className="px-6 py-3">Published</th>
                <th scope="col" className="px-6 py-3">Expires At</th>
                <th scope="col" className="px-6 py-3"></th>
              </tr>
            </thead>
            <tbody>
              {filteredData?.map((deal: DealType, index: number) => (
                <tr key={deal.id} className="bg-white border-b hover:bg-gray-50">
                  <td className="px-6 py-4">
                    <input
                      type="checkbox"
                      checked={selectedDeals.includes(deal.id)}
                      onChange={() => handleSelectDeal(deal.id)}
                    />
                  </td>
                  <td className="px-6 py-4">{(currentPage - 1) * itemsPerPage + index + 1}</td>
                  <td className="px-6 py-4 font-medium text-gray-900 whitespace-nowrap">
                    {highlightText(deal.title, searchQuery)}
                  </td>
                  <td className="px-6 py-4">{deal.description}</td>
                  <td className="px-6 py-4">{deal.discount}</td>
                  <td className="px-6 py-4">{deal.published ? 'Yes' : 'No'}</td>
                  <td className="px-6 py-4">{new Date(deal.expiresAt).toLocaleDateString()}</td>
                  <td className="px-6 py-4 flex gap-x-4">
                    <button
                      className="font-medium text-green-600"
                      onClick={() => handleRestoreClick(deal)}
                      data-tooltip-id="restore-tooltip"
                      data-tooltip-content="Restore"
                    >
                      <RotateCw />
                    </button>
                    <button
                      className="font-medium text-red-600"
                      onClick={() => handleDeleteClick(deal)}
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

          {hasNextPage && (
            <div className="flex justify-center mt-4">
              <button
                onClick={() => fetchNextPage()}
                disabled={isFetchingNextPage}
                className="px-4 py-2 bg-gray-800 text-white rounded-lg hover:bg-gray-900"
              >
                {isFetchingNextPage ? "Loading more..." : "Load More"}
              </button>
            </div>
          )}

          {totalPages > 1 && (
            <div className="flex justify-center items-center mt-4">
              <Pagination
                currentPage={currentPage}
                totalPages={totalPages}
                onPageChange={handlePageChange}
              />
            </div>
          )}
        </>
      )}

      {showRestorePopup && (
        <Popup
          onClose={() => setShowRestorePopup(false)}
          onConfirm={confirmRestore}
          loading={restoreMutation.isPending}
          confirmText="Restore"
          loadingText="Restoring..."
          cancelText="Cancel"
        >
          <p>Are you sure you want to restore {selectedDeal?.title}?</p>
        </Popup>
      )}

      {showRestoreManyPopup && (
        <Popup
          onClose={() => setShowRestoreManyPopup(false)}
          onConfirm={confirmRestoreMany}
          loading={restoreManyMutation.isPending}
          confirmText="Restore"
          loadingText="Restoring..."
          cancelText="Cancel"
        >
          <p>Are you sure you want to restore {selectedDeals.length} deals?</p>
        </Popup>
      )}

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
          <p>Are you sure you want to delete {selectedDeal?.title}?</p>
        </Popup>
      )}

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
            Are you sure you want to delete {selectedDeals.length} deals?
            <span className="text-red-600"> *This action is irreversible.</span>
          </p>
        </Popup>
      )}
    </div>
  );
};

export default DeletedDeals;
