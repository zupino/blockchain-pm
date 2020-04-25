pragma solidity ^0.6.2;

import './Drop.sol';


contract TransferToken {
	function transfer() external {
		Drop token = Drop(0x73EA86DdC523D299916aa1d089652706B4C3D460);
		token.transfer(msg.sender, 100);
	}
}
