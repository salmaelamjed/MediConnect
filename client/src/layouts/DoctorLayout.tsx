import { Outlet} from "react-router-dom"
const DoctorLayout = () => {
 return (
    <div>
      <div className="container p-4 mx-auto">
        <Outlet />
      </div>
    </div>
  );
}

export default DoctorLayout
