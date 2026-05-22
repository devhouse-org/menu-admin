import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import axios from "axios";
import { RotateCw, SquarePen, Trash2 } from "lucide-react";
import Popup from "@/components/Popup";
import { Link } from "react-router-dom";
import Spinner from "@/components/Spinner";
import { highlightText } from "../../utils/utils";
import Pagination from "@/components/Pagination"; // Import the Pagination component
import axiosInstance from "@/axiosInstance";

type ThemeType = {
  id: string;
  name: string;
  description: string;
};

const DeletedThemes = () => {
  const [showDeletePopup, setShowDeletePopup] = useState(false); // Separate state for delete popup
  const [showRestorePopup, setShowRestorePopup] = useState(false); // Separate state for restore popup
  const [showRestoreManyPopup, setShowRestoreManyPopup] = useState(false);
  const [selectedTheme, setSelectedTheme] = useState<ThemeType | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedItems, setSelectedItems] = useState<string[]>([]); // State to manage selected items for checkbox selection
  const [showDeleteManyPopup, setShowDeleteManyPopup] = useState(false); // State to manage delete many popup visibility
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const queryClient = useQueryClient();

  // Fetch deleted themes based on current page
  const {
    data: themesData,
    isLoading,
    isError,
    refetch,
  } = useQuery({
    queryKey: ["findAll-deleted-themes", currentPage],
    queryFn: async () => {
      const params = new URLSearchParams();
      params.append("page", String(currentPage));

      // Fetching deleted themes from the server
      const theme = await axiosInstance.get(`/theme/findAll-deleted`, {
        params,
      });
      return theme.data;
    },
  });

  // Handle theme restoration
  const restoreMutation = useMutation({
    mutationFn: async (id: string) => {
      await axiosInstance.put(`/theme/restore/${id}`);
    },
    onSuccess: () => {
      refetch();
      queryClient.invalidateQueries({ queryKey: ["findAll-deleted-themes"] });
      setShowRestorePopup(false); // Close the restore popup after success
    },
  });

  // Handle themes restoration
  const restoreManyMutation = useMutation({
    mutationFn: async (selectedItemsIds: string[]) => {
      await axiosInstance.put(`/theme/restore-many`, {
        data: selectedItemsIds,
      });
    },
    onSuccess: () => {
      refetch();
      queryClient.invalidateQueries({
        queryKey: ["restore-themes"],
      });
      setShowRestoreManyPopup(false); // Close the restore popup after success
    },
  });

  // Handle theme final deletion
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      await axiosInstance.delete(`/theme/${id}`);
    },
    onSuccess: () => {
      refetch();
      queryClient.invalidateQueries({ queryKey: ["findAll-deleted-themes"] });
      setShowDeletePopup(false); // Close the delete popup after success
    },
  });

  // Handle bulk delete operation — standardized DeleteManyDto payload
  const deleteManyMutation = useMutation({
    mutationFn: (selectedItemsIds: string[]) => {
      return axiosInstance.delete(`/theme/delete-many`, {
        data: { data: selectedItemsIds },
      });
    },
    onSuccess: () => {
      refetch();
      setShowDeleteManyPopup(false);
      setSelectedItems([]); // Clear selected items after successful deletion
      queryClient.invalidateQueries({
        queryKey: ["findAll-deleted-themes"],
      });
    },
  });

  // Handle restore and delete operations
  const handleRestoreClick = (theme: ThemeType) => {
    setSelectedTheme(theme);
    setShowRestorePopup(true); // Show restore popup
  };

  const handleDeleteClick = (theme: ThemeType) => {
    setSelectedTheme(theme);
    setShowDeletePopup(true); // Show delete popup
  };

  const confirmRestore = () => {
    if (selectedTheme) {
      restoreMutation.mutate(selectedTheme.id);
    }
  };

  const confirmRestoreMany = () => {
    if (selectedItems) {
      restoreManyMutation.mutate(selectedItems);
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
    if (selectedTheme) {
      deleteMutation.mutate(selectedTheme.id);
    }
  };

  const filteredData = themesData?.items?.filter((theme: any) =>
    theme.restaurant?.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const totalPages = Math.ceil(themesData?.totalItems / itemsPerPage);

  const handlePageChange = (newPage: number) => {
    setCurrentPage(newPage);
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
              placeholder="Search for themes"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>
        <div className="flex gap-4 items-start">
          {selectedItems.length > 0 && (
            <button
              type="button"
              className="text-white bg-red-700 hover:bg-gray-900 focus:outline-none  font-medium rounded-lg  px-3 py-2.5"
              onClick={handleDeleteMany}
            >
              Delete {selectedItems.length}
            </button>
          )}
          {selectedItems.length > 0 && (
            <button
              type="button"
              className="text-white bg-green-600 hover:bg-gray-900 focus:outline-none  font-medium rounded-lg  px-3 py-2.5"
              onClick={handleRestoreMany}
            >
              Restore {selectedItems.length}
            </button>
          )}
        </div>
      </div>

      {/* Themes Table */}
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
            <th scope="col" className="px-6 py-3"></th>
          </tr>
        </thead>
        <tbody>
          {filteredData?.map((theme: any, index: number) => (
            <tr key={theme.id} className="bg-white border-b hover:bg-gray-50">
              <td className="px-6 py-4">
                <input
                  type="checkbox"
                  checked={selectedItems.includes(theme.id)}
                  onChange={() => handleSelectItem(theme.id)}
                />
              </td>
              <td className="px-6 py-4">
                {(currentPage - 1) * itemsPerPage + index + 1}
              </td>
              <td className="px-6 py-4 font-medium text-gray-900 whitespace-nowrap">
                {highlightText(theme?.restaurant.name, searchQuery)}
              </td>
              <td className="px-6 py-4">{theme?.restaurant.description}</td>
              <td className="px-6 py-4 flex gap-x-4">
                {/* <Link to={`/themes/edit/${theme?.id}`} state={theme}>
                  <SquarePen className="text-blue-600" />
                </Link> */}
                <button
                  className="font-medium text-green-600"
                  onClick={() => handleRestoreClick(theme)}
                >
                  <RotateCw />
                </button>
                <button
                  className="font-medium text-red-600"
                  onClick={() => handleDeleteClick(theme)}
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
          <p>Are you sure you want to restore this theme?</p>
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
          <p>Are you sure you want to delete this theme?</p>
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
            Are you sure you want to delete {selectedItems.length} themes?
            <span className="text-red-600"> *This action is irreversible.</span>
          </p>
        </Popup>
      )}
    </div>
  );
};

export default DeletedThemes;
