import MuiButton from '@mui/material/Button';
import Menu from '@mui/material/Menu';
import MenuItem from '@mui/material/MenuItem';
import { useTheme } from '@mui/material/styles';
import { useId, useState } from 'react';
import type { DropdownMenuProps } from '../../api';
import { ChevronDownIcon } from './icons';
import { usePortalContainer } from './portal';

export function DropdownMenu({ triggerLabel, triggerIcon, ariaLabel, items }: DropdownMenuProps) {
  const container = usePortalContainer();
  const triggerId = useId();
  const menuId = useId();
  const end = useTheme().direction === 'rtl' ? 'left' : 'right';
  const [anchor, setAnchor] = useState<HTMLElement | null>(null);
  const open = anchor !== null;
  const close = () => {
    setAnchor(null);
  };
  return (
    <>
      <MuiButton
        id={triggerId}
        variant="text"
        size="small"
        aria-label={ariaLabel}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-controls={open ? menuId : undefined}
        startIcon={triggerIcon}
        endIcon={<ChevronDownIcon aria-hidden="true" />}
        onClick={(event) => {
          setAnchor(event.currentTarget);
        }}
      >
        {triggerLabel}
      </MuiButton>
      <Menu
        id={menuId}
        anchorEl={anchor}
        open={open}
        onClose={close}
        container={container}
        anchorOrigin={{ vertical: 'bottom', horizontal: end }}
        transformOrigin={{ vertical: 'top', horizontal: end }}
        slotProps={{ list: { 'aria-labelledby': triggerId } }}
      >
        {items.map((item) => (
          <MenuItem
            key={item.id}
            role="menuitemradio"
            aria-checked={Boolean(item.selected)}
            selected={Boolean(item.selected)}
            onClick={() => {
              item.onSelect();
              close();
            }}
          >
            {item.label}
          </MenuItem>
        ))}
      </Menu>
    </>
  );
}
