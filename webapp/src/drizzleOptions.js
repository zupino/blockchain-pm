import Project from "./contracts/Project.json";

const options = {
	contracts: [Project],
	web3: {
		fallback: {
			type: "ws",
			url: "ws://127.0.0.1:9545",
		},
	}
};

export default options;
