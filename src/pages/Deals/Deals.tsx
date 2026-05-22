import { useState, useEffect } from "react";
import { useInfiniteQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus, RotateCw, SquarePen, Trash2 } from "lucide-react";
import Popup from "@/components/Popup";
import { Link, useSearchParams } from "react-router-dom";
import Spinner from "@/components/Spinner";
import { highlightText } from "../../utils/utils";
import Pagination from "@/components/Pagination";
import axiosInstance from "@/axiosInstance";
import { Tooltip as ReactTooltip } from "react-tooltip";
import "react-tooltip/dist/react-tooltip.css";
import exportCSVFile from "json-to-csv-export";
import { DropdownMenuDemo } from "@/components/DropdownMenu";
import { Switch } from "@/components/ui/switch";
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

const Deals = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [showPopup, setShowPopup] = useState(false);
  const [showDeleteManyPopup, setShowDeleteManyPopup] = useState(false);
  const [selectedDeal, setSelectedDeal] = useState<DealType | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedRestaurant, setSelectedRestaurant] = useState(
    searchParams.get("restaurant") || "all"
  );
  const [selectedDeals, setSelectedDeals] = useState<string[]>([]);
  const [headers, setHeaders] = useState<string[]>([]);
  const [currentPage, setCurrentPage] = useState(
    parseInt(searchParams.get("page") || "1")
  );
  const itemsPerPage = 10;
  const queryParams = new URLSearchParams();

  const queryClient = useQueryClient();

  const {
    data: dealsData,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading,
    isError,
    refetch,
    isRefetching,
  } = useInfiniteQuery({
    queryKey: ["deals", selectedRestaurant],
    initialPageParam: 1,
    queryFn: async ({ pageParam = 1 }) => {
      const params = new URLSearchParams();
      params.append("page", pageParam.toString());
      if (selectedRestaurant) {
        params.append("restaurantId", selectedRestaurant);
      }
      const response = await axiosInstance.get(`/deal`, { params });
      return response.data;
    },
    getNextPageParam: (lastPage, pages) => {
      const totalPages = Math.ceil(lastPage.totalItems / itemsPerPage);
      const nextPage = pages.length + 1;
      return nextPage <= totalPages ? nextPage : undefined;
    },
    refetchOnWindowFocus: false,
  });

  const deals = dealsData?.pages.flatMap(page => page.items) ?? [];

  const filteredDeals = deals.filter((deal: DealType) =>
    deal.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleExport = () => {
    const dataToConvert = {
      data: deals,
      filename: "deals",
      delimiter: ",",
      headers,
    };

    exportCSVFile(dataToConvert);
  };

  const handleReload = async () => {
    await queryClient.invalidateQueries({
      queryKey: ["deals", selectedRestaurant],
    });
    refetch();
  };

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
    getNextPageParam: (lastPage, pages) => {
      const totalPages = Math.ceil(lastPage.totalItems / itemsPerPage);
      const nextPage = pages.length + 1;
      return nextPage <= totalPages ? nextPage : undefined;
    },
  });

  const restaurants = restaurantsData?.pages.flatMap(page => page.items) ?? [];

  const mutation = useMutation({
    mutationFn: async (id: string) => {
      await axiosInstance.delete(`/deal/soft-delete/${id}`);
    },
    onSuccess: () => {
      refetch();
      queryClient.invalidateQueries({ queryKey: ["deals"] });
      setShowPopup(false);
    },
  });

  const deleteManyMutation = useMutation({
    mutationFn: (selectedDealIds: string[]) => {
      // Backend expects { data: string[] } (standardized DeleteManyDto).
      return axiosInstance.put(`/deal/soft-delete-many`, { data: selectedDealIds });
    },
    onSuccess: () => {
      refetch();
      queryClient.invalidateQueries({ queryKey: ["deals"] });
      setShowDeleteManyPopup(false);
      setSelectedDeals([]);
    },
  });

  const updatePublishedMutation = useMutation({
    mutationFn: async ({ id, published }: { id: string; published: boolean }) => {
      await axiosInstance.put(`/deal/${id}`, { published });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["deals"] });
    },
  });

  const handlePublishedToggle = (id: string, currentStatus: boolean) => {
    updatePublishedMutation.mutate({ id, published: !currentStatus });
  };

  useEffect(() => {
    queryClient.invalidateQueries({ 
      queryKey: ["deals", selectedRestaurant]
    });
    
    queryParams.set("page", "1");
    if (selectedRestaurant && selectedRestaurant !== "all") {
      queryParams.set("restaurant", selectedRestaurant);
    } else {
      queryParams.delete("restaurant");
    }
    setSearchParams(queryParams);
  }, [selectedRestaurant, queryClient]);

  const handleDeleteClick = (deal: DealType) => {
    setSelectedDeal(deal);
    setShowPopup(true);
  };

  const confirmDelete = () => {
    if (selectedDeal) {
      mutation.mutate(selectedDeal.id);
    }
  };

  const confirmDeleteMany = () => {
    if (selectedDeals.length > 0) {
      deleteManyMutation.mutate(selectedDeals);
    }
  };

  const handleDeleteMany = () => {
    setShowDeleteManyPopup(true);
  };

  const handleSelectAll = () => {
    if (selectedDeals.length === filteredDeals?.length) {
      setSelectedDeals([]);
    } else {
      const allIds = filteredDeals?.map((deal: DealType) => deal.id) || [];
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

  const handleRestaurantChange = (value: string) => {
    setSelectedRestaurant(value);
    setCurrentPage(1);
    setSelectedDeals([]);
    
    queryParams.set("page", "1");
    if (value !== "all") {
      queryParams.set("restaurant", value);
    } else {
      queryParams.delete("restaurant");
    }
    setSearchParams(queryParams);
  };

  const handlePageChange = (newPage: number) => {
    setCurrentPage(newPage);
    setSelectedDeals([]);
    
    queryParams.set("page", newPage.toString());
    if (selectedRestaurant && selectedRestaurant !== "all") {
      queryParams.set("restaurant", selectedRestaurant);
    }
    setSearchParams(queryParams);
    
    // Calculate if we need to fetch more data
    const totalItemsNeeded = newPage * itemsPerPage;
    const currentTotalItems = dealsData?.pages.reduce(
      (total, page) => total + page.items.length,
      0
    ) || 0;

    if (totalItemsNeeded > currentTotalItems && hasNextPage) {
      fetchNextPage();
    }
  };

  const totalPages = dealsData?.pages[0]?.totalItems 
    ? Math.ceil(dealsData.pages[0].totalItems / itemsPerPage) 
    : 0;

  if (isLoading) {
    return (
      <div className="w-full h-screen flex items-center justify-center">
        <Spinner />
      </div>
    );
  }

  if (isError) {
    return <div>Error loading deals</div>;
  }

  return (
    <div className="relative overflow-x-auto sm:rounded-lg w-full mx-6 md:mx-0 scrollbar-hide">
      <ReactTooltip id="delete-many-tooltip" place="top" />
      <ReactTooltip id="reload-tooltip" place="top" />
      <ReactTooltip id="add-deal-tooltip" place="top" />
      <ReactTooltip id="edit-deal-tooltip" place="top" />
      <ReactTooltip id="delete-deal-tooltip" place="top" />

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

        <div className="gap-2 flex items-start justify-center">
          {selectedDeals.length > 0 && (
            <button
              type="button"
              className="text-white w-10 h-10 xl:w-auto bg-red-600 hover:bg-red-700 focus:outline-none font-medium rounded-lg px-3 py-2.5"
              onClick={handleDeleteMany}
              data-tooltip-id="delete-many-tooltip"
              data-tooltip-content="Delete selected deals"
            >
              <div className="flex items-center flex-nowrap gap-1">
                <Trash2 size={16} />
                <span className="hidden xl:flex">Delete</span>
                <span className="hidden xl:flex">{selectedDeals.length}</span>
              </div>
            </button>
          )}

          <button
            type="button"
            disabled={isRefetching}
            className="text-white w-10 h-10 xl:w-auto bg-gray-800 text-sm hover:bg-gray-900 font-medium rounded-lg py-2.5 px-3 disabled:animate-pulse disabled:bg-gray-600"
            onClick={handleReload}
            data-tooltip-id="reload-tooltip"
            data-tooltip-content="Reload deals"
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

          <Link to="/deals/add">
            <button
              type="button"
              className="text-white w-10 h-10 xl:w-auto bg-gray-800 hover:bg-gray-900 font-medium rounded-lg py-2 xl:py-2.5 px-3 text-nowrap text-sm"
              data-tooltip-id="add-deal-tooltip"
              data-tooltip-content="Add new deal"
            >
              <span className="hidden xl:flex items-center gap-1">
                <Plus size={16} /> Add Deal
              </span>
              <span className="inline xl:hidden">
                <Plus size={16} />
              </span>
            </button>
          </Link>
          <Link to="/deals/trash">
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

          <DropdownMenuDemo handleExport={handleExport} link="/deals/import" />
        </div>
      </div>

      {filteredDeals && filteredDeals.length === 0 ? (
        <div className="text-center py-10">
          <p className="text-gray-500 text-lg font-medium">No Deals available</p>
        </div>
      ) : (
        <>
          <table className="w-full text-sm text-left rtl:text-right text-gray-500">
            <thead className="text-xs text-gray-700 uppercase bg-gray-50">
              <tr>
                <th scope="col" className="px-6 py-3 w-4">
                  <input
                    type="checkbox"
                    checked={selectedDeals.length === filteredDeals?.length}
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
              {filteredDeals?.map((deal: DealType, index: number) => (
                <tr key={deal.id} className="bg-white border-b hover:bg-gray-50">
                  <td className="px-6 py-4">
                    <input
                      type="checkbox"
                      checked={selectedDeals.includes(deal.id)}
                      onChange={() => handleSelectDeal(deal.id)}
                    />
                  </td>
                  <td className="px-6 py-4">{index + 1}</td>
                  <td className="px-6 py-4 font-medium text-gray-900 whitespace-nowrap">
                    {highlightText(deal.title, searchQuery)}
                  </td>
                  <td className="px-6 py-4">{deal.description}</td>
                  <td className="px-6 py-4">{deal.discount}</td>
                  <td className="px-6 py-4">
                    <Switch
                      className="data-[state=checked]:bg-green-400"
                      checked={deal.published}
                      onCheckedChange={() => handlePublishedToggle(deal.id, deal.published)}
                      disabled={updatePublishedMutation.isPending}
                    />  
                  </td>
                  <td className="px-6 py-4">{new Date(deal.expiresAt).toLocaleDateString()}</td>
                  <td className="px-6 py-4 flex gap-x-4">
                    <Link
                      to={`/deals/edit/${deal.id}`}
                      state={deal}
                      data-tooltip-id="edit-deal-tooltip"
                      data-tooltip-content="Edit deal"
                    >
                      <SquarePen className="text-blue-600" />
                    </Link>
                    <button
                      className="font-medium text-red-600"
                      onClick={() => handleDeleteClick(deal)}
                      data-tooltip-id="delete-deal-tooltip"
                      data-tooltip-content="Delete deal"
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
        </>
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
          <p>Are you sure you want to delete {selectedDeal?.title}?</p>
        </Popup>
      )}

      {showDeleteManyPopup && (
        <Popup
          onClose={() => setShowDeleteManyPopup(false)}
          onConfirm={confirmDeleteMany}
          loading={deleteManyMutation.isPending}
          confirmText="Delete"
          loadingText="Deleting..."
          cancelText="Cancel"
          confirmButtonVariant="red"
        >
          <p>
            Are you sure you want to delete {selectedDeals.length} deal(s)?
          </p>
        </Popup>
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
    </div>
  );
};

export default Deals;
