import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App.tsx";
import './index.css';

// ReactDOM.render(<App />, document.getElementById("root"));

const Demo = () => <div>hello aaa</div>;

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
    <Demo/>
  </React.StrictMode>,
)
import.meta.hot.accept(() => {
  ReactDOM.createRoot(document.getElementById('root')!).render(
    <React.StrictMode>
      <App />
      <Demo/>
    </React.StrictMode>,
  )
})

