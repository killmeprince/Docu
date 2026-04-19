import type { FileAttachmentResponse } from '../../types/api';
import { fileSizeLabel } from '../../lib/format';
import { Button } from '../ui/Button';

export function AttachmentList({
  items,
  onDownload,
}: {
  items: FileAttachmentResponse[];
  onDownload: (attachment: FileAttachmentResponse) => void;
}): JSX.Element {
  return (
    <div className="list-stack">
      {items.map((item) => (
        <div key={item.id} className="line-card">
          <div>
            <div className="line-card-title">{item.originalName}</div>
            <div className="line-card-meta">{fileSizeLabel(item.sizeBytes)}</div>
          </div>
          <Button variant="ghost" onClick={() => onDownload(item)}>
            Скачать
          </Button>
        </div>
      ))}
    </div>
  );
}
