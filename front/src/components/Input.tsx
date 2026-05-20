import type {InputHTMLAttributes} from 'react';

type InputProps = InputHTMLAttributes<HTMLInputElement>

export function Input(props: InputProps) {
    return (
        <input
            className="w-full p-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
            {...props}
        />
    );
}