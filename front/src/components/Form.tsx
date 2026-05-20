import type {ReactNode, SyntheticEvent} from 'react';

interface FormProps {
    onSubmit: (e: SyntheticEvent<HTMLFormElement>) => void;
    children: ReactNode;
}

export function Form({ onSubmit, children }: FormProps) {
    return (
        <form onSubmit={onSubmit} className="space-y-4">
            {children}
        </form>
    );
}