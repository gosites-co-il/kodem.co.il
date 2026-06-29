# Nx + shadcn/ui + Next.js + express

## About


## Developers Tips



### Installing new shadcn/ui components
After following the installation steps above, installing shadcn/ui components is a simple task and requires the following steps

````
npx shadcn-ui@latest add <component> # e.g button
````

Add/Export the new component to libs/shadcn-ui/src/index.ts

```
export * from './components/ui/command';
```
Now, you're able to use your component on your Nx Project
```
import { Button } from '@libs/shadcn-ui';
```
 

