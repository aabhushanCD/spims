import { useMemo, useState } from "react";

import { useAuth } from "@/features/auth/context/authContext";
import { UserStats } from "../components/UserStats";
import { UserTable } from "../components/UserTable";
import { UserToolbar } from "../components/UserToolbar";
import { useToggleUserActivation } from "../hooks/useMutateUser";
import { useGetAllUsers } from "../hooks/useUser";

const UserPage = () => {
  const { currentUser } = useAuth();
  const canManage = currentUser?.role === "owner";
  const users = useGetAllUsers();
  const toggleActivation = useToggleUserActivation();
  const [search, setSearch] = useState("");

  const filteredUsers = useMemo(() => {
    const query = search.trim().toLowerCase();
    const allUsers = users.data ?? [];

    if (!query) {
      return allUsers;
    }

    return allUsers.filter((user) =>
      `${user.name} ${user.email}`.toLowerCase().includes(query),
    );
  }, [search, users.data]);

  return (
    <div className="space-y-6">
      <UserStats
        total={filteredUsers.length}
        active={filteredUsers.filter((user) => user.isActive).length}
        inactive={filteredUsers.filter((user) => !user.isActive).length}
      />

      <UserToolbar
        search={search}
        canManage={canManage}
        setSearch={setSearch}
      />

      <UserTable
        users={filteredUsers}
        canManage={canManage}
        onDelete={(id) => toggleActivation.mutate(id)}
      />
    </div>
  );
};

export default UserPage;
