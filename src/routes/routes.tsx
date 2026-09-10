import { Routes, Route } from 'react-router-dom';
import Layout from '../Components/Layout/Layout';
import NotFound from '../Components/Shared/NotFound';
import VotingPage from '../Components/Voting/VotingPage';

export default function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<Layout />}>
        <Route index element={<VotingPage />} />
        <Route path="*" element={<NotFound />} />
      </Route>
    </Routes>
  );
}
