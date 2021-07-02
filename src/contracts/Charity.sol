// SPDX-License-Identifier: MIT

pragma solidity >=0.7.0 <0.9.0;

interface IERC20Token {
  function transfer(address, uint256) external returns (bool);
  function approve(address, uint256) external returns (bool);
  function transferFrom(address, address, uint256) external returns (bool);
  function totalSupply() external view returns (uint256);
  function balanceOf(address) external view returns (uint256);
  function allowance(address, address) external view returns (uint256);

  event Transfer(address indexed from, address indexed to, uint256 value);
  event Approval(address indexed owner, address indexed spender, uint256 value);
}

contract Charity {

// length of books 
    uint public booksLength = 0;
    
// total amount donated to charity cause
     uint public amountDonated = 0;
     
// total amount of sales that have occured
     uint public booksSold = 0;     
     
     address payable public charity_owner ;
     
// cusd token address
    address internal cUsdTokenAddress = 0x874069Fa1Eb16D44d622F2e0Ca25eeA172369bC1;

// our structure for each book
    struct Book {
        address payable owner;
        string book_name;
        string cover_photo;
        string description;
        uint price;
        uint sales;
    }
    
constructor(){
        charity_owner = payable(msg.sender);
    }
   

// maps an integer to a book
    mapping (uint => Book) internal books;


// thiis functionality adds a new book to the blockhain
    function addBook(
        string memory _book_name,
        string memory _cover_photo,
        string memory _description, 
        uint _price
    ) public {
        // ensure only charity owner can add a books
        require(msg.sender == charity_owner, "Only owner can add a book");
        
        // declare number of sales to be 0
        uint _sales = 0;
        
        
        books[booksLength] = Book(
            payable(msg.sender),
            _book_name,
            _cover_photo,
            _description,
            _price,
            _sales
        );
        // increase the number of books by one
        booksLength++;
    }


// fetch a particular book
    function fetchBook(uint _index) public view returns (
        address payable,
        string memory, 
        string memory,
        string memory, 
        uint, 
        uint
    ) {
        return (
            books[_index].owner,
            books[_index].book_name, 
            books[_index].cover_photo, 
            books[_index].description, 
            books[_index].price,
            books[_index].sales
        );
    }

// donate to charity by buying a book
    function buyBook(uint _index) public payable  {
        require(
          IERC20Token(cUsdTokenAddress).transferFrom(
            msg.sender,
            books[_index].owner,
            books[_index].price
          ),
          "Failed to donate to charity."
        );
        
        // increment number of sales
        books[_index].sales++;
        // increment number of books sold
        booksSold ++;
        amountDonated += books[_index].price;
    }
    
    
    // donate directly to a charitable cause without buying a book
     function donate(uint _price) public payable  {
        require(
          IERC20Token(cUsdTokenAddress).transferFrom(
            msg.sender,
            charity_owner,
            _price
           
          ),
          "Failed to donate to charity."
        );
        
        // increment amount donated
        amountDonated += _price;
    }
    

}