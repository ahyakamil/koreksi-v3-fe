import { useState } from 'react';
import { Layout } from '../components/Layout';
import WarRoomChat from '../components/WarRoomChat';

const WarRoomPage = () => {
  const [apiUrl] = useState(process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1');

  return (
    <WarRoomChat apiUrl={apiUrl} />
  );
};

export default WarRoomPage;