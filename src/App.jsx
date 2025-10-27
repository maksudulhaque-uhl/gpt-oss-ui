import Chat from "./Chat";
import Header from "./Header";
import { ThemeProvider } from "./ThemeContext";

function App() {
  return (
    <ThemeProvider>
      <div className="flex flex-col bg-gray-100 dark:bg-gray-900">
        <Header />
        <main className="grow">
          <Chat />
        </main>
      </div>
    </ThemeProvider>
  );
}

export default App;
