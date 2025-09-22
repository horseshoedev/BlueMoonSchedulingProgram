import React from 'react';

interface ProfilePictureProps {
  name: string;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const ProfilePicture: React.FC<ProfilePictureProps> = ({ 
  name, 
  size = 'md', 
  className = '' 
}) => {
  const sizeClasses = {
    sm: 'w-6 h-6 text-xs',
    md: 'w-8 h-8 text-sm',
    lg: 'w-20 h-20 text-2xl'
  };

  return (
    <div className={`${sizeClasses[size]} rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-bold ${className}`}>
      {name.charAt(0).toUpperCase()}
    </div>
  );
};

export default ProfilePicture;
