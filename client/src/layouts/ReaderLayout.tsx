import { Outlet } from 'react-router-dom';
/** Article routes deliberately live outside AppLayout's persistent navigation. */
export const ReaderLayout = () => <div className="reader-route"><Outlet /></div>;
