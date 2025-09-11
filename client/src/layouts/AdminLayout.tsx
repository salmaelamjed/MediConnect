import { Outlet} from "react-router-dom";
const AdminLayout = () => {

  return (
    <div className="flex h-screen">
      <div className="flex flex-col flex-1">
        <main className="flex-1 p-6 bg-gray-100">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default AdminLayout;
