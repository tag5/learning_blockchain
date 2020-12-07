// SPDX-License-Identifier: MIT
pragma solidity 0.6.11;

import "https://github.com/OpenZeppelin/openzeppelin-contracts/contracts/math/SafeMath.sol";

contract PullPayment {

  using SafeMath for uint256;
  mapping (address => uint256) public payments;

  // Dans un premier temps, cette fonction est appellée par celui qui veut envoyer des Ether à une autre personne
  // C'est pour cette raison que je l'ai mis EXTERNAL et PAYABLE
  function envoie_ether(address dest) external payable {
      // On ne paie pas directement le destinataire
      // Les ether sont automatiquement stockés sur le compte du contrat
      // On mémorise une "trace" de cette transaction, pour savoir à qui distribuer les ether quand il viendra les reclammer
      payments[dest] = payments[dest].add(msg.value);
  }

  // Fonction appellée dans un deuxieme temps par le destinataire du paiement pour réclamer son du
  // Problème: ça va lui couter des frais pour effectuer cet appel...
  // Je l'ai mis EXTERNAL et non public, car on ne l'appelle que de l'extérieur
  function recupere_ether() external {
      require(payments[msg.sender] != 0,"On ne vous doit rien pour l'instant.");
      
      // Le contrat envoie l'argent qui était stocké provisoirement sur son propre compte au destinataire
      
      // msg.sender.transfer(payments[msg.sender]);	// I ne faut pas utiliser transfer selon le cours
      
      (bool success, ) = msg.sender.call{value: payments[msg.sender]}("");    
      if (success)
      {
          payments[msg.sender] = 0;
      }
      else
      {
          revert();     // Utile ? Car si on passe là, rien n'aura été modifié sur la blockchain...
      }
  }

  // Pour debug: Cette fonction nous permet de voir combien il y a d'ether en attente sur le compte du contrat
  function get_balance_de_ce_contrat() external view returns (uint) {
      return address(this).balance;
  }
}
