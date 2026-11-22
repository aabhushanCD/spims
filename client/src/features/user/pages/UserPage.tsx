import { useAuth } from "@/features/auth/context/authContext";
import { UserStats } from "../components/UserStats";
import { UserTable } from "../components/UserTable";
import { UserToolbar } from "../components/UserToolbar";
import { useToggleUserActivation } from "../hooks/useMutateUser";
import { useGetAllUsers } from "../hooks/useUser";

const UserPage = () => {
  // const users = useGetAllUsers();

  const { currentUser } = useAuth();
  const canManage = currentUser?.role === "owner";
  const users = useGetAllUsers();
  const toggleActivation = useToggleUserActivation();
  const handleSearch = (value: string) => {
    // Implement search functionality here
    console.log("Searching for:", value);
  };
  const handleEdit = (id: string) => {
    // Implement edit functionality here
    console.log("Editing user with ID:", id);
  };

  const handleToggleActivation = (id: string) => {
    console.log("Toggling activation for user with ID:", id);
    toggleActivation.mutate(id);
  };

  return (
    <div className="space-y-6">
      <UserStats
        total={users?.data?.length || 0}
        active={users?.data?.filter((u) => u.isActive).length || 0}
        inactive={users?.data?.filter((u) => !u.isActive).length || 0}
      />

      <UserToolbar
        search={"Search..."}
        canManage={canManage}
        setSearch={handleSearch}
      />

      <UserTable
        users={users?.data}
        canManage={canManage}
        onEdit={handleEdit}
        onDelete={handleToggleActivation}
      />
    </div>
  );
};

export default UserPage;
