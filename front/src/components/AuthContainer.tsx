import type {ReactNode} from 'react';

export function AuthContainer({ children }: { children: ReactNode }) {
    return (
        <div className="flex items-center justify-center min-h-screen bg-gray-100">
            <div className="p-8 bg-white rounded shadow-md w-96">
                {children}
            </div>
        </div>
    );
}