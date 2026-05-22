import { useState, useEffect } from "react";
import { useInfiniteQuery, useMutation, useQueryClient } from "@tanstack/react-query";
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

type QuestionType = {
  id: string;
  title: string;
  enTitle: string;
  description: string;
};

const DeletedQuestions = () => {
  const [showDeletePopup, setShowDeletePopup] = useState(false);
  const [showRestorePopup, setShowRestorePopup] = useState(false);
  const [showRestoreManyPopup, setShowRestoreManyPopup] = useState(false);
  const [selectedQuestion, setSelectedQuestion] = useState<QuestionType | null>(null);
  const [selectedItems, setSelectedItems] = useState<string[]>([]);
  const [showDeleteManyPopup, setShowDeleteManyPopup] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedRestaurant, setSelectedRestaurant] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const queryClient = useQueryClient();

  // Update to use infinite query for deleted questions
  const {
    data: questionsData,
    isLoading,
    isError,
    fetchNextPage: fetchNextPageQuestions,
    hasNextPage: hasNextPageQuestions,
    isFetchingNextPage: isFetchingNextPageQuestions,
    refetch,
  } = useInfiniteQuery({
    queryKey: ["findAll-deleted-questions", selectedRestaurant],
    queryFn: async ({ pageParam = 1 }) => {
      const params = new URLSearchParams();
      if (selectedRestaurant && selectedRestaurant !== 'all') {
        params.append("restaurantId", selectedRestaurant);
      }
      params.append("page", pageParam.toString());
      params.append("limit", itemsPerPage.toString());
      
      const response = await axiosInstance.get(`/question/deleted?${params.toString()}`);
      return response.data;
    },
    getNextPageParam: (lastPage) => {
      if (!lastPage || !lastPage.hasNextPage) return undefined;
      return lastPage.nextPage;
    },
    initialPageParam: 1,
  });

  // Add restaurants infinite query
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

  // Rest of the mutations remain the same
  const restoreMutation = useMutation({
    mutationFn: async (id: string) => {
      await axiosInstance.put(`/question/restore/${id}`);
    },
    onSuccess: () => {
      refetch();
      queryClient.invalidateQueries({ queryKey: ["findAll-deleted-questions"] });
      setShowRestorePopup(false);
    },
  });

  // Update filtered data to work with infinite query
  const filteredData = questionsData?.pages.flatMap(page => 
    page.items.filter((question: QuestionType) =>
      question.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      question.enTitle?.toLowerCase().includes(searchQuery.toLowerCase())
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
    const currentTotalItems = questionsData?.pages.reduce(
      (total, page) => total + page.items.length,
      0
    ) || 0;

    if (totalItemsNeeded > currentTotalItems && hasNextPageQuestions) {
      fetchNextPageQuestions();
    }
  };

  // Rest of the component remains similar, update the JSX to include restaurant filter and load more buttons

  const deleteManyMutation = useMutation({
    mutationFn: async (ids: string[]) => {
      // The endpoint is `/question/delete-many` (NOT `/question/many`),
      // and the backend expects `{ data: string[] }` (DeleteManyDto).
      await axiosInstance.delete('/question/delete-many', { data: { data: ids } });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["findAll-deleted-questions"] });
      setShowDeleteManyPopup(false);
      setSelectedItems([]);
    },
  });

  const handleDeleteMany = () => {
    setShowDeleteManyPopup(true);
  };

  const confirmDeleteMany = () => {
    deleteManyMutation.mutate(selectedItems);
  };

  const restoreManyMutation = useMutation({
    mutationFn: async (ids: string[]) => {
      // Standardized DeleteManyDto shape — `data` not `ids`.
      await axiosInstance.put('/question/restore-many', { data: ids });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["findAll-deleted-questions"] });
      setShowRestoreManyPopup(false);
      setSelectedItems([]);
    },
  });

  const handleRestoreMany = () => {
    setShowRestoreManyPopup(true);
  };

  const confirmRestoreMany = () => {
    restoreManyMutation.mutate(selectedItems);
  };

  const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked) {
      setSelectedItems(filteredData.map(q => q.id));
    } else {
      setSelectedItems([]);
    }
  };

  const handleRestoreClick = (question: QuestionType) => {
    setSelectedQuestion(question);
    setShowRestorePopup(true);
  };

  const confirmRestore = () => {
    if (selectedQuestion) {
      restoreMutation.mutate(selectedQuestion.id);
    }
  };

  const handleSelectItem = (id: string) => {
    setSelectedItems(prev => 
      prev.includes(id) 
        ? prev.filter(item => item !== id)
        : [...prev, id]
    );
  };

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      await axiosInstance.delete(`/question/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["findAll-deleted-questions"] });
      setShowDeletePopup(false);
    },
  });

  const handleDeleteClick = (question: QuestionType) => {
    setSelectedQuestion(question);
    setShowDeletePopup(true);
  };

  const confirmDelete = () => {
    if (selectedQuestion) {
      deleteMutation.mutate(selectedQuestion.id);
    }
  };

  const handleRestaurantChange = (value: string) => {
    setSelectedRestaurant(value);
    setCurrentPage(1);
    setSelectedItems([]);
    queryClient.resetQueries({ queryKey: ["findAll-deleted-questions"] });
  };

  useEffect(() => {
    setCurrentPage(1);
    setSelectedItems([]);
    queryClient.resetQueries({ queryKey: ["findAll-deleted-questions"] });
  }, [selectedRestaurant, searchQuery]);

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
              placeholder="Search for questions"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          {/* Restaurant Filter */}
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
              className="text-white bg-red-700 hover:bg-gray-900 focus:outline-none font-medium rounded-lg px-3 py-2.5"
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
              className="text-white bg-green-600 hover:bg-gray-900 focus:outline-none font-medium rounded-lg px-3 py-2.5"
              onClick={handleRestoreMany}
              data-tooltip-id="restore-many-tooltip"
              data-tooltip-content="Restore all selected"
            >
              Restore {selectedItems.length}
            </button>
          )}
        </div>
      </div>

      {/* Conditional rendering when no questions are found */}
      {filteredData?.length === 0 ? (
        <div className="text-center py-10">
          <p className="text-gray-500">No deleted questions found.</p>
        </div>
      ) : (
        <>
          {/* Questions Table */}
          <div className="overflow-x-auto">
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
                    English Title
                  </th>
                  <th scope="col" className="px-6 py-3">
                    Arabic Title
                  </th>
                  <th scope="col" className="px-6 py-3">
                    Restaurant
                  </th>
                  <th scope="col" className="px-6 py-3"></th>
                </tr>
              </thead>
              <tbody>
                {currentData?.map((question: any, index: number) => (
                  <tr
                    key={question.id}
                    className="bg-white border-b hover:bg-gray-50"
                  >
                    <td className="px-6 py-4">
                      <input
                        type="checkbox"
                        checked={selectedItems.includes(question.id)}
                        onChange={() => handleSelectItem(question.id)}
                      />
                    </td>
                    <td className="px-6 py-4">
                      {(currentPage - 1) * itemsPerPage + index + 1}
                    </td>
                    <td className="px-6 py-4 font-medium text-gray-900 whitespace-nowrap">
                      {highlightText(question?.enTitle, searchQuery)}
                    </td>
                    <td className="px-6 py-4">{question?.title}</td>
                    <td className="px-6 py-4">{question?.resturant?.name}</td>
                    <td className="px-6 py-4 flex gap-x-4">
                      <button
                        className="font-medium text-green-600"
                        onClick={() => handleRestoreClick(question)}
                        data-tooltip-id="restore-tooltip"
                        data-tooltip-content="Restore"
                      >
                        <RotateCw />
                      </button>
                      <button
                        className="font-medium text-red-600"
                        onClick={() => handleDeleteClick(question)}
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
          </div>

          {/* Add Load More button for questions */}
          {hasNextPageQuestions && (
            <div className="flex justify-center mt-4">
              <button
                onClick={() => fetchNextPageQuestions()}
                disabled={isFetchingNextPageQuestions}
                className="px-4 py-2 bg-gray-800 text-white rounded-md hover:bg-gray-700 disabled:bg-gray-500"
              >
                {isFetchingNextPageQuestions ? "Loading more..." : "Load More"}
              </button>
            </div>
          )}

          {/* Pagination Component */}
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
          <p>Are you sure you want to restore this question?</p>
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
          <p>Are you sure you want to restore {selectedItems.length} questions?</p>
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
          <p>Are you sure you want to delete this question?</p>
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
            Are you sure you want to delete {selectedItems.length} questions?
            <span className="text-red-600"> *This action is irreversible.</span>
          </p>
        </Popup>
      )}
    </div>
  );
};

export default DeletedQuestions;
