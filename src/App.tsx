/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Routes, Route } from 'react-router-dom';
import Game from './components/Game';
import Admin from './components/Admin';

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Game />} />
      <Route path="/admin" element={<Admin />} />
    </Routes>
  );
}
