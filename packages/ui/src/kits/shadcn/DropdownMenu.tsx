import { ChevronDownIcon } from 'lucide-react';
import type { DropdownMenuProps } from '../../api';
import { Button } from './components/ui/button';
import {
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenu as Root,
  DropdownMenuTrigger,
} from './components/ui/dropdown-menu';

export function DropdownMenu({ triggerLabel, triggerIcon, ariaLabel, items }: DropdownMenuProps) {
  const selected = items.find((item) => item.selected)?.id ?? '';
  return (
    <Root modal={false}>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="sm" aria-label={ariaLabel}>
          {triggerIcon}
          <span>{triggerLabel}</span>
          <ChevronDownIcon aria-hidden="true" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuRadioGroup value={selected}>
          {items.map((item) => (
            <DropdownMenuRadioItem
              key={item.id}
              value={item.id}
              onSelect={() => {
                item.onSelect();
              }}
            >
              {item.label}
            </DropdownMenuRadioItem>
          ))}
        </DropdownMenuRadioGroup>
      </DropdownMenuContent>
    </Root>
  );
}
