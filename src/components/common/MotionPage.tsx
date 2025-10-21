import React from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

interface MotionPageProps {
  children: React.ReactNode;
  className?: string;
}

const MotionPage: React.FC<MotionPageProps> = ({ children, className }) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.3 }}
      className={cn(className)}
    >
      {children}
    </motion.div>
  );
};

export default MotionPage;
