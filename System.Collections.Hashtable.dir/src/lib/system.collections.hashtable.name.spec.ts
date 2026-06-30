import { systemCollectionsHashtableName } from './system.collections.hashtable.name';

describe('systemCollectionsHashtableName', () => {
  it('should work', () => {
    expect(systemCollectionsHashtableName()).toEqual(
      'System.Collections.Hashtable.name',
    );
  });
});
