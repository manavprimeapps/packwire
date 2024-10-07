import { Button, Popover, ActionList, Icon } from '@shopify/polaris';
import { ImportIcon, CheckSmallIcon, ExportIcon } from '@shopify/polaris-icons';
import { useState, useCallback } from 'react';

export function ImportExportBtn() {
  const [active, setActive] = useState(true);

  const toggleActive = useCallback(() => setActive((active) => !active), []);

  const activator = (
    <Button onClick={toggleActive} disclosure>
      More actions
    </Button>
  );

  return (
    <div style={{ height: '200px' }}>
      <Popover active={active} activator={activator} onClose={toggleActive}>
        <ActionList
          actionRole="menuitem"
          items={[
            {
              active: true,
              content: 'Import file',
              icon: ImportIcon,
              suffix: <Icon source={CheckSmallIcon} />,
            },
            { content: 'Export file', icon: ExportIcon },
          ]}
        />
      </Popover>
    </div>
  );
}
