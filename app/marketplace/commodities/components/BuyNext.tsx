import React from "react";
import { useAccount } from 'wagmi';
import ConnectButton from "@/app/components/shared/ConnectButton";

const UserForm = () => {
  const { isConnected } = useAccount();

  return (
    <div className="p-6 w-full text-color4 max-w-md mx-auto bg-gray-100 rounded-2xl shadow-md space-y-4">
      {/* Name Section */}
      <div className="bg-gray-200 p-4 rounded-xl">
        <label className="block text-sm">Name</label>
        <div className="flex justify-between text-lg font-medium">
          <span>Name</span>
          <span>First name</span>
        </div>
      </div>

      {/* Mail Section */}
      <div className="bg-gray-200 p-4 rounded-xl">
        <label className="block text-sm">Mail</label>
        <div className="text-lg font-medium">...</div>
      </div>

      {/* Reception Address */}
      <div className="bg-gray-200 p-4 rounded-xl">
        <label className="block text-sm">Reception address</label>
        <div className="mt-2">
          <ConnectButton
            connectText="Connect"
            className={`w-full py-2 rounded-xl font-medium shadow ${
              isConnected ? "bg-gray-400" : "bg-blue-600 text-white"
            }`}
            showAddress={true}
          />
        </div>
      </div>

      {/* Next Button */}
      <ConnectButton
        connectText="Connect Wallet to Buy"
        connectedText="Buy"
        className="w-full bg-color4 text-white py-3 rounded-xl font-medium shadow-sm"
      />
    </div>
  );
};

export default UserForm;
