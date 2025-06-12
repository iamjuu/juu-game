import { createBrowserRouter } from "react-router-dom";
import Game from "../page/game";
import SelectCar from "../page/selectCar";
import App from "../App";

const router = createBrowserRouter([
  {
    path: "/",
    element: <App />,
    children: [
      {
        path: "game",
        element: <Game />,
      },
      {
        path: "select-car",
        element: <SelectCar />,
      },
    ],
  },
]);

export default router;
