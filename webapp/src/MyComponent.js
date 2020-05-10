import React from 'react';
import { 
	AccountData, 
	ContractData,
	ContractForm 
} from 'drizzle-react-components';


const MyComponent = () => (
	<div>
		<h2>Balance of first account</h2>
		<AccountData accountIndex={0} units={"ether"} precision={3} />
		<h2>getProjectBudgetDrop()</h2>
		<ContractData contract="Project" method="getProjectBudgetDrop" />
		<h2>addTask()()</h2>
		<ContractForm contract="Project" method="addTask" labels={['new value of `data`']} />
	</div>
);

export default MyComponent;
