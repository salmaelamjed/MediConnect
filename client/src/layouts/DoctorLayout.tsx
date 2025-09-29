import { Outlet} from "react-router-dom"
const DoctorLayout = () => {
 return (
    <div>
      <div className="container pt-6 mx-auto">
        <Outlet />
      </div>
    </div>
  );
}

export default DoctorLayout
