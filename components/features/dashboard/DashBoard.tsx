'use client';

import React from 'react';
import SnapshotModal from './SnapshotModal';

const DashBoard = () => {
  return (
    <div>
      <div className="flex flex-col items-center justify-center gap-4">
        <h1 className="text-2xl text-black font-bold pt-4">Dashboard</h1>
      </div>
      <SnapshotModal />
    </div>
  );
};

export default DashBoard;
