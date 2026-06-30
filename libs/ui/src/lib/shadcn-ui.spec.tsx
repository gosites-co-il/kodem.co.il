import { render } from '@testing-library/react';

import ShadcnUi from './shadcn-ui';

describe('ShadcnUi', () => {
  it('should render successfully', () => {
    const { baseElement } = render(<ShadcnUi />);
    expect(baseElement).toBeTruthy();
  });
});
