import type {ButtonHTMLAttributes} from 'react';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
    variant?: 'primary' | 'success' | 'danger';
}

export function Button({ variant = 'primary', className = '', ...props }: ButtonProps) {
    const baseStyles = "w-full p-2 text-white rounded transition-colors";
    const variants = {
        primary: "bg-blue-600 hover:bg-blue-700",
        success: "bg-green-600 hover:bg-green-700",
        danger: "bg-red-500 hover:bg-red-600",
    };

    return (
        <button
            className={`${baseStyles} ${variants[variant]} ${className}`}
            {...props}
        />
    );
}