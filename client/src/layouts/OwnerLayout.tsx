import { Outlet} from "react-router-dom";
const OwnerLayout = () => {

  return (
    <div className="flex h-screen">
      <div className="flex flex-col flex-1">
        <main className="flex-1 pt-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default OwnerLayout;
