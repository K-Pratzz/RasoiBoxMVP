import { Link } from 'react-router-dom';
import { Empty } from '../components/ui';

export default function NotFound() {
  return <div className="container-x py-16"><Empty icon="🍲" title="Page not found">That page doesn't exist.<div className="mt-4"><Link to="/" className="btn-primary">Back to home</Link></div></Empty></div>;
}
