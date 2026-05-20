import { Link } from 'react-router-dom';

interface AuthFooterProps {
    text: string;
    linkText: string;
    to: string;
}

export function AuthFooter({ text, linkText, to }: AuthFooterProps) {
    return (
        <p className="mt-4 text-sm text-center">
            {text} <Link to={to} className="text-blue-600 hover:underline">{linkText}</Link>
        </p>
    );
}