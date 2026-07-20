import { UserStats } from "../components/UserStats";
import { UserTable } from "../components/UserTable";
import { UserToolbar } from "../components/UserToolbar";
import { useToggleUserActivation } from "../hooks/useMutateUser";
import { useGetAllUsers } from "../hooks/useUser";

const UserPage = () => {
  // const users = useGetAllUsers();
  const users = useGetAllUsers();
  const toggleActivation = useToggleUserActivation();
  const handleSearch = (value: string) => {
    // Implement search functionality here
  };
  const handleEdit = (id: string) => {
    // Implement edit functionality here
  };

  const handleToggleActivation = (id: string) => {
    console.log("Toggling activation for user with ID:", id);
    toggleActivation.mutate(id);
  };

  return (
    <div className="space-y-6">
      <UserStats
        total={users?.data?.length}
        active={users?.data?.filter((u) => u.isActive).length}
        inactive={users?.data?.filter((u) => !u.isActive).length}
      />

      <UserToolbar search={""} />

      <UserTable
        users={users?.data}
        onEdit={handleEdit}
        onDelete={handleToggleActivation}
      />
    </div>
  );
};

export default UserPage;
