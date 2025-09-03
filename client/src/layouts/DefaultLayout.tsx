import { Outlet, useLocation } from "react-router-dom";
import Header from "../components/shared/Header";

const DefaultLayout = () => {
  const location = useLocation();
  const hideHeader = ["/login", "/register","/register_doctor","/send_otp","/verify_otp","/reset_password"].includes(location.pathname);

  return (
    <div>
      {!hideHeader && <Header  />}
      <div className="container p-2 mx-auto">
        <Outlet />
      </div>
    </div>
  );
};

export default DefaultLayout;
